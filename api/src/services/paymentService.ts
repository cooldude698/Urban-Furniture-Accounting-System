import { PoolClient } from 'pg';
import Decimal from 'decimal.js';
import { pool } from '../db/pool';
import { SequenceService } from './sequenceService';
import { PostingService } from './postingService';

export interface PaymentAllocationInput {
  invoiceId?: number;
  billId?: number;
  amount: string | number;
}

export interface CreatePaymentDTO {
  direction?: 'inbound' | 'outbound';
  partnerId: number;
  method: 'cash' | 'bank';
  paymentDate?: string;
  amount: string | number;
  allocations: PaymentAllocationInput[];
}

export interface PaymentHistoryItem {
  allocationId: number;
  paymentId: number;
  paymentNumber: string;
  paymentDate: string;
  method: 'cash' | 'bank';
  direction: 'inbound' | 'outbound';
  amount: string;
  runningRemaining: string;
}

export interface CustomerReceivableItem {
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  invoiceCount: number;
}

export class PaymentService {
  /**
   * Create and post a payment with allocations.
   * Runs atomically inside a single transaction:
   * 1. Validate total allocations == payment.amount
   * 2. Validate allocation <= document amount_due (from v_invoice_status / v_bill_status)
   * 3. Insert into payments
   * 4. Insert into payment_allocations
   * 5. Call PostingService.postDocument('payment', id, tx)
   *    -> Inbound: DR Cash/Bank, CR Debtors (partner = customer)
   *    -> Outbound: DR Creditors, CR Cash/Bank
   * 6. Write audit_log
   */
  static async createPayment(dto: CreatePaymentDTO, userId?: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const direction = dto.direction || 'inbound';
      const partnerId = dto.partnerId;
      const method = dto.method;
      const paymentDate = dto.paymentDate || new Date().toISOString().split('T')[0];
      const paymentAmount = new Decimal(dto.amount);

      if (paymentAmount.lte(0)) {
        throw new Error('Payment amount must be greater than zero');
      }

      if (!dto.allocations || dto.allocations.length === 0) {
        throw new Error('At least one payment allocation is required');
      }

      // Sum allocation amounts
      let allocSum = new Decimal(0);
      for (const alloc of dto.allocations) {
        const amt = new Decimal(alloc.amount);
        if (amt.lte(0)) {
          throw new Error('Each allocated amount must be greater than zero');
        }
        allocSum = allocSum.plus(amt);
      }

      if (!allocSum.equals(paymentAmount)) {
        throw new Error(
          `Sum of allocations (${allocSum.toFixed(2)}) must equal payment total amount (${paymentAmount.toFixed(2)})`
        );
      }

      // Validate each allocation against amount_due from v_invoice_status / v_bill_status
      for (const alloc of dto.allocations) {
        if (alloc.invoiceId) {
          const invStatusRes = await client.query<{
            invoice_id: number;
            number: string;
            customer_id: number;
            amount_due: string;
            total: string;
          }>(
            `SELECT invoice_id, number, customer_id, amount_due, total 
             FROM v_invoice_status 
             WHERE invoice_id = $1`,
            [alloc.invoiceId]
          );

          if (invStatusRes.rows.length === 0) {
            throw new Error(`Customer invoice #${alloc.invoiceId} not found`);
          }

          const invStatus = invStatusRes.rows[0];
          if (invStatus.customer_id !== partnerId) {
            throw new Error(`Invoice ${invStatus.number} does not belong to partner #${partnerId}`);
          }

          const due = new Decimal(invStatus.amount_due);
          const allocating = new Decimal(alloc.amount);
          if (allocating.gt(due)) {
            throw new Error(
              `Cannot allocate ${allocating.toFixed(2)} to Invoice ${invStatus.number}: maximum amount due is ${due.toFixed(2)}`
            );
          }
        } else if (alloc.billId) {
          const billStatusRes = await client.query<{
            bill_id: number;
            number: string;
            vendor_id: number;
            amount_due: string;
          }>(
            `SELECT bill_id, number, vendor_id, amount_due 
             FROM v_bill_status 
             WHERE bill_id = $1`,
            [alloc.billId]
          );

          if (billStatusRes.rows.length === 0) {
            throw new Error(`Vendor bill #${alloc.billId} not found`);
          }

          const billStatus = billStatusRes.rows[0];
          if (billStatus.vendor_id !== partnerId) {
            throw new Error(`Bill ${billStatus.number} does not belong to partner #${partnerId}`);
          }

          const due = new Decimal(billStatus.amount_due);
          const allocating = new Decimal(alloc.amount);
          if (allocating.gt(due)) {
            throw new Error(
              `Cannot allocate ${allocating.toFixed(2)} to Bill ${billStatus.number}: maximum amount due is ${due.toFixed(2)}`
            );
          }
        } else {
          throw new Error('Each allocation must specify either invoiceId or billId');
        }
      }

      // Generate sequence number
      const paymentNumber = await SequenceService.nextDocNumber('PAY', client);

      // Insert payment record
      const payRes = await client.query<{ id: number }>(
        `INSERT INTO payments (number, direction, partner_id, method, payment_date, amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [paymentNumber, direction, partnerId, method, paymentDate, paymentAmount.toFixed(2)]
      );
      const paymentId = payRes.rows[0].id;

      // Insert allocations
      for (const alloc of dto.allocations) {
        await client.query(
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

      // Post document via PostingService
      const { entryId } = await PostingService.postDocument('payment', paymentId, client);

      // Audit log
      await client.query(
        `INSERT INTO audit_log (table_name, record_id, action, user_id, after_data)
         VALUES ($1, $2, 'pay', $3, $4)`,
        [
          'payments',
          paymentId,
          userId || null,
          JSON.stringify({
            number: paymentNumber,
            direction,
            partnerId,
            method,
            paymentDate,
            amount: paymentAmount.toFixed(2),
            journalEntryId: entryId,
            allocations: dto.allocations,
          }),
        ]
      );

      await client.query('COMMIT');

      return {
        id: paymentId,
        number: paymentNumber,
        direction,
        partnerId,
        method,
        paymentDate,
        amount: paymentAmount.toFixed(2),
        journalEntryId: entryId,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment history for a customer invoice with running remaining balance
   */
  static async getInvoicePaymentHistory(invoiceId: number): Promise<PaymentHistoryItem[]> {
    // 1. Fetch invoice total
    const invRes = await pool.query<{ total: string }>(
      'SELECT total FROM customer_invoices WHERE id = $1',
      [invoiceId]
    );
    if (invRes.rows.length === 0) {
      throw new Error(`Customer invoice #${invoiceId} not found`);
    }

    const totalInvoice = new Decimal(invRes.rows[0].total);

    // 2. Fetch allocations in chronological order
    const allocRes = await pool.query<{
      allocation_id: number;
      payment_id: number;
      payment_number: string;
      payment_date: string;
      method: 'cash' | 'bank';
      direction: 'inbound' | 'outbound';
      amount: string;
    }>(
      `SELECT 
         pa.id as allocation_id,
         p.id as payment_id,
         p.number as payment_number,
         p.payment_date,
         p.method,
         p.direction,
         pa.amount
       FROM payment_allocations pa
       JOIN payments p ON p.id = pa.payment_id
       WHERE pa.invoice_id = $1
       ORDER BY p.payment_date ASC, pa.id ASC`,
      [invoiceId]
    );

    let runningRemaining = totalInvoice;
    const history: PaymentHistoryItem[] = [];

    for (const row of allocRes.rows) {
      const allocated = new Decimal(row.amount);
      runningRemaining = runningRemaining.minus(allocated);
      history.push({
        allocationId: row.allocation_id,
        paymentId: row.payment_id,
        paymentNumber: row.payment_number,
        paymentDate: row.payment_date ? new Date(row.payment_date).toISOString().split('T')[0] : '',
        method: row.method,
        direction: row.direction,
        amount: allocated.toFixed(2),
        runningRemaining: runningRemaining.toFixed(2),
      });
    }

    return history;
  }

  /**
   * Customer receivables summary: per customer, total invoiced / total paid / total outstanding
   */
  static async getReceivablesSummary(): Promise<CustomerReceivableItem[]> {
    const res = await pool.query<CustomerReceivableItem>(
      `SELECT 
         c.id AS "customerId",
         c.name AS "customerName",
         c.email AS "customerEmail",
         c.mobile AS "customerPhone",
         COALESCE(SUM(vis.total), 0)::text AS "totalInvoiced",
         COALESCE(SUM(vis.amount_paid), 0)::text AS "totalPaid",
         COALESCE(SUM(vis.amount_due), 0)::text AS "totalOutstanding",
         COUNT(vis.invoice_id)::int AS "invoiceCount"
       FROM contacts c
       JOIN customer_invoices ci ON ci.customer_id = c.id
       JOIN v_invoice_status vis ON vis.invoice_id = ci.id
       WHERE ci.status = 'confirmed'
       GROUP BY c.id, c.name, c.email, c.mobile
       ORDER BY COALESCE(SUM(vis.amount_due), 0) DESC, c.name ASC`
    );

    return res.rows;
  }

  /**
   * Get open (unpaid or partially paid) confirmed invoices for a customer
   */
  static async getOpenInvoicesForCustomer(customerId: number) {
    const res = await pool.query(
      `SELECT 
         ci.id,
         ci.number,
         ci.invoice_date AS "invoiceDate",
         ci.due_date AS "dueDate",
         vis.total::text,
         vis.amount_paid::text AS "amountPaid",
         vis.amount_due::text AS "amountDue",
         vis.payment_status AS "paymentStatus"
       FROM customer_invoices ci
       JOIN v_invoice_status vis ON vis.invoice_id = ci.id
       WHERE ci.customer_id = $1 AND ci.status = 'confirmed' AND vis.amount_due > 0
       ORDER BY ci.invoice_date ASC, ci.id ASC`,
      [customerId]
    );

    return res.rows.map(r => ({
      ...r,
      invoiceDate: r.invoiceDate ? new Date(r.invoiceDate).toISOString().split('T')[0] : '',
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '',
    }));
  }

  /**
   * Get payment history for a vendor bill in chronological order with running balance
   */
  static async getPaymentHistoryForBill(billId: number): Promise<PaymentHistoryItem[]> {
    const billRes = await pool.query<{ total: string }>(
      'SELECT total FROM vendor_bills WHERE id = $1',
      [billId]
    );
    if (billRes.rows.length === 0) return [];

    const totalBill = new Decimal(billRes.rows[0].total);

    const allocRes = await pool.query<{
      allocation_id: number;
      payment_id: number;
      payment_number: string;
      payment_date: string;
      method: 'cash' | 'bank';
      direction: 'inbound' | 'outbound';
      amount: string;
    }>(
      `SELECT 
         pa.id as allocation_id,
         p.id as payment_id,
         p.number as payment_number,
         p.payment_date,
         p.method,
         p.direction,
         pa.amount
       FROM payment_allocations pa
       JOIN payments p ON p.id = pa.payment_id
       WHERE pa.bill_id = $1
       ORDER BY p.payment_date ASC, pa.id ASC`,
      [billId]
    );

    let runningRemaining = totalBill;
    const history: PaymentHistoryItem[] = [];

    for (const row of allocRes.rows) {
      const allocated = new Decimal(row.amount);
      runningRemaining = runningRemaining.minus(allocated);
      history.push({
        allocationId: row.allocation_id,
        paymentId: row.payment_id,
        paymentNumber: row.payment_number,
        paymentDate: row.payment_date ? new Date(row.payment_date).toISOString().split('T')[0] : '',
        method: row.method,
        direction: row.direction,
        amount: allocated.toFixed(2),
        runningRemaining: runningRemaining.toFixed(2),
      });
    }

    return history;
  }
}

