import { PoolClient } from 'pg';
import Decimal from 'decimal.js';
import { pool } from '../db/pool';
import { withTransaction } from '../db/withTransaction';
import { SequenceService } from './sequenceService';
import { PostingService } from './postingService';
import { CreatePaymentInput } from '../shared/schemas/payment';

export interface PaymentHistoryItem {
  payment_id: number;
  payment_number: string;
  payment_date: string;
  method: string;
  amount: string;
  created_at: string;
}

export interface CustomerReceivableItem {
  customer_id: number;
  customer_name: string;
  total_invoiced: string;
  total_paid: string;
  outstanding: string;
}

export interface AgingBucketItem {
  partner_id: number;
  partner_name: string;
  total_due: string;
  current_0_30: string;
  past_31_60: string;
  past_61_90: string;
  past_90_plus: string;
}

export interface AgingReport {
  type: 'receivable' | 'payable';
  asOfDate: string;
  totals: {
    total_due: string;
    current_0_30: string;
    past_31_60: string;
    past_61_90: string;
    past_90_plus: string;
  };
  details: AgingBucketItem[];
}

export class PaymentService {
  /**
   * 1. POST /api/payments
   * Validate: SUM(allocations) == payment.amount
   * Validate: each allocation <= that document's amount_due (from v_invoice_status / v_bill_status)
   * Create payment + payment_allocations, then postDocument('payment', ...)
   */
  static async createPayment(input: CreatePaymentInput): Promise<{
    paymentId: number;
    paymentNumber: string;
    journalEntryId: number;
    amount: string;
  }> {
    const paymentAmount = new Decimal(input.amount);
    if (paymentAmount.isNegative() || paymentAmount.isZero()) {
      throw new Error('Payment amount must be greater than zero');
    }

    // 1. Validate: SUM(allocations) == payment.amount
    let sumAllocations = new Decimal(0);
    for (const alloc of input.allocations) {
      const allocAmt = new Decimal(alloc.amount);
      if (allocAmt.isNegative() || allocAmt.isZero()) {
        throw new Error('Allocation amount must be greater than zero');
      }
      sumAllocations = sumAllocations.plus(allocAmt);
    }

    if (!sumAllocations.equals(paymentAmount)) {
      const err = new Error(
        `Sum of allocations (${sumAllocations.toFixed(2)}) does not match payment amount (${paymentAmount.toFixed(2)})`
      );
      (err as any).code = 'ALLOCATION_MISMATCH';
      (err as any).severity = 'blocking';
      (err as any).statusCode = 400;
      throw err;
    }

    // 2. Validate: each allocation <= document amount_due from view
    for (const alloc of input.allocations) {
      const allocAmt = new Decimal(alloc.amount);

      if (input.direction === 'inbound') {
        if (!alloc.invoiceId) {
          throw new Error('Inbound payments must allocate to customer invoices');
        }
        const invRes = await pool.query<{
          number: string;
          amount_due: string;
          payment_status: string;
        }>('SELECT number, amount_due, payment_status FROM v_invoice_status WHERE invoice_id = $1', [
          alloc.invoiceId,
        ]);
        const invoice = invRes.rows[0];
        if (!invoice) {
          throw new Error(`Customer invoice ${alloc.invoiceId} not found`);
        }
        const due = new Decimal(invoice.amount_due);
        if (allocAmt.greaterThan(due)) {
          const err = new Error(
            `Allocation amount ${allocAmt.toFixed(2)} exceeds amount due ${due.toFixed(2)} on invoice ${invoice.number}`
          );
          (err as any).code = 'OVERPAYMENT_BLOCKED';
          (err as any).severity = 'blocking';
          (err as any).statusCode = 400;
          throw err;
        }
      } else {
        if (!alloc.billId) {
          throw new Error('Outbound payments must allocate to vendor bills');
        }
        const billRes = await pool.query<{
          number: string;
          amount_due: string;
          payment_status: string;
        }>('SELECT number, amount_due, payment_status FROM v_bill_status WHERE bill_id = $1', [
          alloc.billId,
        ]);
        const bill = billRes.rows[0];
        if (!bill) {
          throw new Error(`Vendor bill ${alloc.billId} not found`);
        }
        const due = new Decimal(bill.amount_due);
        if (allocAmt.greaterThan(due)) {
          const err = new Error(
            `Allocation amount ${allocAmt.toFixed(2)} exceeds amount due ${due.toFixed(2)} on bill ${bill.number}`
          );
          (err as any).code = 'OVERPAYMENT_BLOCKED';
          (err as any).severity = 'blocking';
          (err as any).statusCode = 400;
          throw err;
        }
      }
    }

    // 3. Create payment and allocations in a single transaction
    let paymentId = 0;
    let paymentNumber = '';
    let entryId = 0;

    await withTransaction(async (tx) => {
      paymentNumber = await SequenceService.nextDocNumber('PAY', tx);
      const payDate = input.paymentDate || new Date().toISOString().split('T')[0];

      const pRes = await tx.query<{ id: number }>(
        `INSERT INTO payments
           (number, direction, partner_id, method, payment_date, amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          paymentNumber,
          input.direction,
          input.partnerId,
          input.method,
          payDate,
          paymentAmount.toFixed(2),
        ]
      );
      paymentId = pRes.rows[0].id;

      for (const alloc of input.allocations) {
        await tx.query(
          `INSERT INTO payment_allocations (payment_id, invoice_id, bill_id, amount)
           VALUES ($1, $2, $3, $4)`,
          [
            paymentId,
            alloc.invoiceId || null,
            alloc.billId || null,
            new Decimal(alloc.amount).toFixed(2),
          ]
        );
      }

      // Post the payment entry to the financial ledger
      const postResult = await PostingService.postDocument('payment', paymentId, tx);
      entryId = postResult.entryId;
    });

    return {
      paymentId,
      paymentNumber,
      journalEntryId: entryId,
      amount: paymentAmount.toFixed(2),
    };
  }

  /**
   * 2. GET /api/invoices/:id/payments — full history: date, method, amount
   */
  static async getInvoicePayments(invoiceId: number): Promise<PaymentHistoryItem[]> {
    const res = await pool.query<PaymentHistoryItem>(
      `SELECT
         p.id AS payment_id,
         p.number AS payment_number,
         p.payment_date::TEXT AS payment_date,
         p.method,
         pa.amount::TEXT AS amount,
         p.created_at::TEXT AS created_at
       FROM payment_allocations pa
       JOIN payments p ON p.id = pa.payment_id
       WHERE pa.invoice_id = $1
       ORDER BY p.payment_date DESC, p.id DESC`,
      [invoiceId]
    );
    return res.rows;
  }

  /**
   * 3. GET /api/receivables — customer-wise: total invoiced, total paid, outstanding
   */
  static async getReceivablesSummary(): Promise<CustomerReceivableItem[]> {
    const res = await pool.query<CustomerReceivableItem>(
      `SELECT
         c.id AS customer_id,
         c.name AS customer_name,
         COALESCE(SUM(vis.total), 0)::TEXT AS total_invoiced,
         COALESCE(SUM(vis.amount_paid), 0)::TEXT AS total_paid,
         COALESCE(SUM(vis.amount_due), 0)::TEXT AS outstanding
       FROM contacts c
       JOIN customer_invoices ci ON ci.customer_id = c.id
       JOIN v_invoice_status vis ON vis.invoice_id = ci.id
       WHERE ci.status = 'confirmed'
       GROUP BY c.id, c.name
       ORDER BY COALESCE(SUM(vis.amount_due), 0) DESC, c.name ASC`
    );
    return res.rows;
  }

  /**
   * 4. GET /api/aging?type=receivable|payable — buckets 0-30, 31-60, 61-90, 90+
   */
  static async getAgingReport(type: 'receivable' | 'payable'): Promise<AgingReport> {
    const isReceivable = type === 'receivable';

    const query = isReceivable
      ? `
        SELECT
          c.id AS partner_id,
          c.name AS partner_name,
          COALESCE(SUM(vis.amount_due), 0)::TEXT AS total_due,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(ci.due_date, ci.invoice_date)) <= 30 THEN vis.amount_due ELSE 0 END), 0)::TEXT AS current_0_30,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(ci.due_date, ci.invoice_date)) BETWEEN 31 AND 60 THEN vis.amount_due ELSE 0 END), 0)::TEXT AS past_31_60,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(ci.due_date, ci.invoice_date)) BETWEEN 61 AND 90 THEN vis.amount_due ELSE 0 END), 0)::TEXT AS past_61_90,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(ci.due_date, ci.invoice_date)) > 90 THEN vis.amount_due ELSE 0 END), 0)::TEXT AS past_90_plus
        FROM contacts c
        JOIN customer_invoices ci ON ci.customer_id = c.id
        JOIN v_invoice_status vis ON vis.invoice_id = ci.id
        WHERE ci.status = 'confirmed' AND vis.amount_due > 0
        GROUP BY c.id, c.name
        ORDER BY COALESCE(SUM(vis.amount_due), 0) DESC, c.name ASC
      `
      : `
        SELECT
          c.id AS partner_id,
          c.name AS partner_name,
          COALESCE(SUM(vbs.amount_due), 0)::TEXT AS total_due,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(vb.due_date, vb.bill_date)) <= 30 THEN vbs.amount_due ELSE 0 END), 0)::TEXT AS current_0_30,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(vb.due_date, vb.bill_date)) BETWEEN 31 AND 60 THEN vbs.amount_due ELSE 0 END), 0)::TEXT AS past_31_60,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(vb.due_date, vb.bill_date)) BETWEEN 61 AND 90 THEN vbs.amount_due ELSE 0 END), 0)::TEXT AS past_61_90,
          COALESCE(SUM(CASE WHEN (CURRENT_DATE - COALESCE(vb.due_date, vb.bill_date)) > 90 THEN vbs.amount_due ELSE 0 END), 0)::TEXT AS past_90_plus
        FROM contacts c
        JOIN vendor_bills vb ON vb.vendor_id = c.id
        JOIN v_bill_status vbs ON vbs.bill_id = vb.id
        WHERE vb.status = 'confirmed' AND vbs.amount_due > 0
        GROUP BY c.id, c.name
        ORDER BY COALESCE(SUM(vbs.amount_due), 0) DESC, c.name ASC
      `;

    const res = await pool.query<AgingBucketItem>(query);
    const details = res.rows;

    let totDue = new Decimal(0);
    let tot0_30 = new Decimal(0);
    let tot31_60 = new Decimal(0);
    let tot61_90 = new Decimal(0);
    let tot90Plus = new Decimal(0);

    for (const item of details) {
      totDue = totDue.plus(new Decimal(item.total_due));
      tot0_30 = tot0_30.plus(new Decimal(item.current_0_30));
      tot31_60 = tot31_60.plus(new Decimal(item.past_31_60));
      tot61_90 = tot61_90.plus(new Decimal(item.past_61_90));
      tot90Plus = tot90Plus.plus(new Decimal(item.past_90_plus));
    }

    return {
      type,
      asOfDate: new Date().toISOString().split('T')[0],
      totals: {
        total_due: totDue.toFixed(2),
        current_0_30: tot0_30.toFixed(2),
        past_31_60: tot31_60.toFixed(2),
        past_61_90: tot61_90.toFixed(2),
        past_90_plus: tot90Plus.toFixed(2),
      },
      details,
    };
  }
}
