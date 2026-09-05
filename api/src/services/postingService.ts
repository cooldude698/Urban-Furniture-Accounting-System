import { PoolClient } from 'pg';
import Decimal from 'decimal.js';
import { SequenceService } from './sequenceService';

export type DocumentType = 'bill' | 'invoice' | 'payment';

export interface PostResult {
  entryId: number;
}

interface AccountCache {
  [name: string]: number;
}

interface JournalCache {
  [name: string]: number;
}

export class PostingService {
  private static accountCache: AccountCache = {};
  private static journalCache: JournalCache = {};

  private static async getAccountId(name: string, client: PoolClient): Promise<number> {
    if (this.accountCache[name]) return this.accountCache[name];
    const res = await client.query<{ id: number }>(
      'SELECT id FROM accounts WHERE name = $1 AND is_archived = false',
      [name]
    );
    if (!res.rows[0]) {
      throw new Error(`Account not found: "${name}"`);
    }
    this.accountCache[name] = res.rows[0].id;
    return res.rows[0].id;
  }

  private static async getJournalId(name: string, client: PoolClient): Promise<number> {
    if (this.journalCache[name]) return this.journalCache[name];
    const res = await client.query<{ id: number }>(
      'SELECT id FROM journals WHERE name = $1 AND is_archived = false',
      [name]
    );
    if (!res.rows[0]) {
      throw new Error(`Journal not found: "${name}"`);
    }
    this.journalCache[name] = res.rows[0].id;
    return res.rows[0].id;
  }

  /**
   * Only this module writes to journal_entries and journal_entry_lines.
   * Runs strictly within the caller's raw pg PoolClient transaction.
   *
   * @param type 'bill' | 'invoice' | 'payment'
   * @param id The document primary key ID
   * @param tx The active PoolClient transaction
   */
  static async postDocument(
    type: DocumentType,
    id: number,
    tx: PoolClient
  ): Promise<PostResult> {
    switch (type) {
      case 'bill':
        return this.postBill(id, tx);
      case 'invoice':
        return this.postInvoice(id, tx);
      case 'payment':
        return this.postPayment(id, tx);
      default:
        throw new Error(`Unsupported document type for posting: ${type}`);
    }
  }

  /**
   * Posts a Vendor Bill
   * DR Purchase Expense (per line, with analytic_account_id, partner = vendor, ex-tax)
   * DR Input Tax (tax total, skip if zero)
   * CR Creditors (partner = vendor, grand total)
   */
  private static async postBill(billId: number, tx: PoolClient): Promise<PostResult> {
    // 1. Lock and fetch bill
    const billRes = await tx.query<{
      id: number;
      number: string;
      bill_reference: string | null;
      vendor_id: number;
      bill_date: string;
      subtotal: string;
      tax_total: string;
      total: string;
      journal_entry_id: number | null;
      status: string;
    }>('SELECT * FROM vendor_bills WHERE id = $1 FOR UPDATE', [billId]);

    const bill = billRes.rows[0];
    if (!bill) throw new Error(`Vendor bill ${billId} not found`);

    // Idempotency: if already posted, return existing entryId
    if (bill.journal_entry_id) {
      return { entryId: bill.journal_entry_id };
    }

    // 2. Fetch bill lines
    const linesRes = await tx.query<{
      id: number;
      line_no: number;
      account_id: number | null;
      analytic_account_id: number | null;
      subtotal: string;
      tax_amount: string;
      total: string;
    }>('SELECT * FROM vendor_bill_lines WHERE bill_id = $1 ORDER BY line_no ASC', [billId]);

    const billLines = linesRes.rows;
    if (billLines.length === 0) {
      throw new Error(`Cannot post vendor bill ${billId} with no lines`);
    }

    // 3. Resolve required accounts & journals
    const journalId = await this.getJournalId('Purchase', tx);
    const defaultExpenseAccountId = await this.getAccountId('Purchase Expense', tx);
    const creditorsAccountId = await this.getAccountId('Creditors', tx);
    const inputTaxAccountId = await this.getAccountId('Input Tax Credit', tx);

    // 4. Generate JE sequence number
    const jeNumber = await SequenceService.nextDocNumber('JE', tx);

    // 5. Create Draft Journal Entry
    const entryRes = await tx.query<{ id: number }>(
      `INSERT INTO journal_entries
         (number, journal_id, entry_date, reference, status, source_type, source_id)
       VALUES ($1, $2, $3, $4, 'draft', 'bill', $5)
       RETURNING id`,
      [jeNumber, journalId, bill.bill_date, bill.number, bill.id]
    );
    const entryId = entryRes.rows[0].id;

    // 6. Insert lines
    // A. Expense lines (DR) per bill line
    for (const line of billLines) {
      const lineSubtotal = new Decimal(line.subtotal);
      if (lineSubtotal.isZero()) continue;

      const accountId = line.account_id || defaultExpenseAccountId;
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, $4, $5, 0, $6)`,
        [
          entryId,
          accountId,
          bill.vendor_id,
          line.analytic_account_id,
          lineSubtotal.toFixed(2),
          `Bill ${bill.number} - Line ${line.line_no}`,
        ]
      );
    }

    // B. Input Tax line (DR) if tax > 0
    const taxTotal = new Decimal(bill.tax_total);
    if (!taxTotal.isZero()) {
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, NULL, $4, 0, $5)`,
        [
          entryId,
          inputTaxAccountId,
          bill.vendor_id,
          taxTotal.toFixed(2),
          `Bill ${bill.number} - Input Tax Credit`,
        ]
      );
    }

    // C. Creditors line (CR) total amount
    const totalAmount = new Decimal(bill.total);
    await tx.query(
      `INSERT INTO journal_entry_lines
         (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
       VALUES ($1, $2, $3, NULL, 0, $4, $5)`,
      [
        entryId,
        creditorsAccountId,
        bill.vendor_id,
        totalAmount.toFixed(2),
        `Bill ${bill.number} - Total Payable`,
      ]
    );

    // 7. Flip entry status to 'posted' last so DEFERRABLE trigger checks at COMMIT
    await tx.query(
      "UPDATE journal_entries SET status = 'posted' WHERE id = $1",
      [entryId]
    );

    // 8. Update bill record
    await tx.query(
      "UPDATE vendor_bills SET journal_entry_id = $1, status = 'confirmed' WHERE id = $2",
      [entryId, bill.id]
    );

    return { entryId };
  }

  /**
   * Posts a Customer Invoice
   * DR Debtors (partner = customer, grand total)
   * CR Sales Income (per line, with analytic, ex-tax)
   * CR Output Tax (tax total, skip if zero)
   */
  private static async postInvoice(invoiceId: number, tx: PoolClient): Promise<PostResult> {
    // 1. Lock and fetch invoice
    const invRes = await tx.query<{
      id: number;
      number: string;
      customer_id: number;
      invoice_date: string;
      subtotal: string;
      tax_total: string;
      total: string;
      journal_entry_id: number | null;
      status: string;
    }>('SELECT * FROM customer_invoices WHERE id = $1 FOR UPDATE', [invoiceId]);

    const invoice = invRes.rows[0];
    if (!invoice) throw new Error(`Customer invoice ${invoiceId} not found`);

    // Idempotency: if already posted, return existing entryId
    if (invoice.journal_entry_id) {
      return { entryId: invoice.journal_entry_id };
    }

    // 2. Fetch invoice lines
    const linesRes = await tx.query<{
      id: number;
      line_no: number;
      account_id: number | null;
      analytic_account_id: number | null;
      subtotal: string;
      tax_amount: string;
      total: string;
    }>('SELECT * FROM customer_invoice_lines WHERE invoice_id = $1 ORDER BY line_no ASC', [invoiceId]);

    const invLines = linesRes.rows;
    if (invLines.length === 0) {
      throw new Error(`Cannot post customer invoice ${invoiceId} with no lines`);
    }

    // 3. Resolve accounts & journals
    const journalId = await this.getJournalId('Sales', tx);
    const debtorsAccountId = await this.getAccountId('Debtors', tx);
    const defaultIncomeAccountId = await this.getAccountId('Sales Income', tx);
    const outputTaxAccountId = await this.getAccountId('Output Tax Payable', tx);

    // 4. Generate JE sequence number
    const jeNumber = await SequenceService.nextDocNumber('JE', tx);

    // 5. Create Draft Journal Entry
    const entryRes = await tx.query<{ id: number }>(
      `INSERT INTO journal_entries
         (number, journal_id, entry_date, reference, status, source_type, source_id)
       VALUES ($1, $2, $3, $4, 'draft', 'invoice', $5)
       RETURNING id`,
      [jeNumber, journalId, invoice.invoice_date, invoice.number, invoice.id]
    );
    const entryId = entryRes.rows[0].id;

    // 6. Insert lines
    // A. Debtors line (DR) grand total
    const totalAmount = new Decimal(invoice.total);
    await tx.query(
      `INSERT INTO journal_entry_lines
         (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
       VALUES ($1, $2, $3, NULL, $4, 0, $5)`,
      [
        entryId,
        debtorsAccountId,
        invoice.customer_id,
        totalAmount.toFixed(2),
        `Invoice ${invoice.number} - Total Receivable`,
      ]
    );

    // B. Income lines (CR) per line
    for (const line of invLines) {
      const lineSubtotal = new Decimal(line.subtotal);
      if (lineSubtotal.isZero()) continue;

      const accountId = line.account_id || defaultIncomeAccountId;
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, $4, 0, $5, $6)`,
        [
          entryId,
          accountId,
          invoice.customer_id,
          line.analytic_account_id,
          lineSubtotal.toFixed(2),
          `Invoice ${invoice.number} - Line ${line.line_no}`,
        ]
      );
    }

    // C. Output Tax line (CR) if tax > 0
    const taxTotal = new Decimal(invoice.tax_total);
    if (!taxTotal.isZero()) {
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, NULL, 0, $4, $5)`,
        [
          entryId,
          outputTaxAccountId,
          invoice.customer_id,
          taxTotal.toFixed(2),
          `Invoice ${invoice.number} - Output Tax Payable`,
        ]
      );
    }

    // 7. Flip entry status to 'posted' last so DEFERRABLE trigger checks at COMMIT
    await tx.query(
      "UPDATE journal_entries SET status = 'posted' WHERE id = $1",
      [entryId]
    );

    // 8. Update invoice record
    await tx.query(
      "UPDATE customer_invoices SET journal_entry_id = $1, status = 'confirmed' WHERE id = $2",
      [entryId, invoice.id]
    );

    return { entryId };
  }

  /**
   * Posts a Payment
   * Inbound (customer payment):  DR Cash|Bank / CR Debtors(partner)
   * Outbound (vendor payment):   DR Creditors(partner) / CR Cash|Bank
   * NEVER touches Income or Expense accounts!
   */
  private static async postPayment(paymentId: number, tx: PoolClient): Promise<PostResult> {
    const payRes = await tx.query<{
      id: number;
      number: string;
      direction: 'inbound' | 'outbound';
      partner_id: number;
      method: 'cash' | 'bank';
      payment_date: string;
      amount: string;
      journal_entry_id: number | null;
    }>('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [paymentId]);

    const payment = payRes.rows[0];
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    // Idempotency: if already posted, return existing entryId
    if (payment.journal_entry_id) {
      return { entryId: payment.journal_entry_id };
    }

    const journalName = payment.method === 'cash' ? 'Cash' : 'Bank';
    const journalId = await this.getJournalId(journalName, tx);
    const liquidAccountId = await this.getAccountId(journalName, tx);

    const jeNumber = await SequenceService.nextDocNumber('JE', tx);

    const entryRes = await tx.query<{ id: number }>(
      `INSERT INTO journal_entries
         (number, journal_id, entry_date, reference, status, source_type, source_id)
       VALUES ($1, $2, $3, $4, 'draft', 'payment', $5)
       RETURNING id`,
      [jeNumber, journalId, payment.payment_date, payment.number, payment.id]
    );
    const entryId = entryRes.rows[0].id;

    const amountStr = new Decimal(payment.amount).toFixed(2);

    if (payment.direction === 'inbound') {
      // Inbound: DR Cash/Bank, CR Debtors
      const debtorsAccountId = await this.getAccountId('Debtors', tx);

      // DR Cash / Bank
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, NULL, $4, 0, $5)`,
        [entryId, liquidAccountId, payment.partner_id, amountStr, `Payment ${payment.number} (Inbound)`]
      );

      // CR Debtors
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, NULL, 0, $4, $5)`,
        [entryId, debtorsAccountId, payment.partner_id, amountStr, `Payment ${payment.number} - Debtors Settled`]
      );
    } else {
      // Outbound: DR Creditors, CR Cash/Bank
      const creditorsAccountId = await this.getAccountId('Creditors', tx);

      // DR Creditors
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, NULL, $4, 0, $5)`,
        [entryId, creditorsAccountId, payment.partner_id, amountStr, `Payment ${payment.number} - Creditors Paid`]
      );

      // CR Cash / Bank
      await tx.query(
        `INSERT INTO journal_entry_lines
           (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
         VALUES ($1, $2, $3, NULL, 0, $4, $5)`,
        [entryId, liquidAccountId, payment.partner_id, amountStr, `Payment ${payment.number} (Outbound)`]
      );
    }

    // Set posted last
    await tx.query(
      "UPDATE journal_entries SET status = 'posted' WHERE id = $1",
      [entryId]
    );

    // Link journal_entry_id on payment
    await tx.query(
      'UPDATE payments SET journal_entry_id = $1 WHERE id = $2',
      [entryId, payment.id]
    );

    return { entryId };
  }
}
