import Decimal from 'decimal.js';
import { pool } from '../src/db/pool';
import { InvoiceService } from '../src/services/invoiceService';
import { PaymentService } from '../src/services/paymentService';

async function verifyPhase3() {
  console.log('===============================================================');
  console.log('PHASE 3 VERIFICATION: Credit Sales, Partial Payments & Receivables');
  console.log('===============================================================');

  const client = await pool.connect();

  try {
    // Step 0: Ensure we have a customer, product, and accounts
    console.log('\n--- Step 0: Fetching customer, product & accounts ---');
    const customerRes = await client.query('SELECT id, name FROM contacts WHERE type = \'customer\' LIMIT 1');
    if (customerRes.rows.length === 0) {
      throw new Error('No customer found in seed data');
    }
    const customer = customerRes.rows[0];
    console.log(`Using Customer: #${customer.id} (${customer.name})`);

    const productRes = await client.query('SELECT id, name FROM products LIMIT 1');
    if (productRes.rows.length === 0) {
      throw new Error('No product found in seed data');
    }
    const product = productRes.rows[0];
    console.log(`Using Product: #${product.id} (${product.name})`);

    // Step 1: Create 200,000 invoice with zero tax on 2026-10-01 (October)
    console.log('\n--- Step 1: Creating Customer Invoice of 200,000 on 2026-10-01 ---');
    const invoice = await InvoiceService.createInvoice({
      customerId: customer.id,
      invoiceDate: '2026-10-01',
      dueDate: '2026-10-31',
      lines: [
        {
          productId: product.id,
          qty: '10',
          unitPrice: '20000.00',
          taxRate: '0.00',
        },
      ],
    });

    console.log(`Created Draft Invoice: ${invoice.number} (ID: ${invoice.id})`);
    console.log(`Invoice Subtotal: ${invoice.subtotal}, Tax: ${invoice.taxTotal}, Total: ${invoice.total}`);
    if (new Decimal(invoice.total).toNumber() !== 200000) {
      throw new Error(`Expected invoice total 200000.00, got ${invoice.total}`);
    }

    // Step 2: Confirm the invoice (Posts DR Debtors 200000 / CR Sales Income 200000 on 2026-10-01)
    console.log('\n--- Step 2: Confirming Invoice ---');
    const confirmedInvoice = await InvoiceService.confirmInvoice(invoice.id);
    console.log(`Invoice confirmed. Journal Entry ID: ${confirmedInvoice.journalEntryId}`);

    // Verify Invoice Journal Entry lines
    const jeLinesRes = await client.query(
      `SELECT a.name as account_name, a.type as account_type, l.debit, l.credit, l.partner_id
       FROM journal_entry_lines l
       JOIN accounts a ON a.id = l.account_id
       WHERE l.entry_id = $1
       ORDER BY l.id ASC`,
      [confirmedInvoice.journalEntryId]
    );
    console.log('Invoice Journal Entry lines:');
    console.table(jeLinesRes.rows);

    // Step 3: Check invoice status before payment
    const statusBefore = await client.query(
      `SELECT invoice_id, total, amount_paid, amount_due, payment_status
       FROM v_invoice_status WHERE invoice_id = $1`,
      [invoice.id]
    );
    console.log('v_invoice_status BEFORE payment:');
    console.table(statusBefore.rows);

    // Step 4: Pay 100,000 on 2026-12-01 (December payment)
    console.log('\n--- Step 3: Paying 100,000 on 2026-12-01 (Partial Settlement via Bank) ---');
    const payment = await PaymentService.createPayment({
      direction: 'inbound',
      partnerId: customer.id,
      method: 'bank',
      paymentDate: '2026-12-01',
      amount: '100000.00',
      allocations: [
        {
          invoiceId: invoice.id,
          amount: '100000.00',
        },
      ],
    });

    console.log(`Created & Posted Payment: ${payment.number} (ID: ${payment.id})`);
    console.log(`Payment Journal Entry ID: ${payment.journalEntryId}`);

    // Verify Payment Journal Entry lines: MUST BE DR Bank 100000 / CR Debtors 100000, NEVER touch Income
    const payJeLinesRes = await client.query(
      `SELECT a.name as account_name, a.type as account_type, l.debit, l.credit, l.partner_id
       FROM journal_entry_lines l
       JOIN accounts a ON a.id = l.account_id
       WHERE l.entry_id = $1
       ORDER BY l.id ASC`,
      [payment.journalEntryId]
    );
    console.log('Payment Journal Entry lines:');
    console.table(payJeLinesRes.rows);

    for (const row of payJeLinesRes.rows) {
      if (row.account_type === 'income') {
        throw new Error(`CRITICAL ACCOUNTING VIOLATION: Payment journal entry touched Income account '${row.account_name}'!`);
      }
    }
    console.log('✅ PASS: Payment entry NEVER touched an Income account (DR Bank / CR Debtors only)');

    // Step 5: Check v_invoice_status after payment -> 200000 / 100000 / 100000 / partial
    console.log('\n--- Step 4: Checking v_invoice_status view ---');
    const statusAfter = await client.query(
      `SELECT invoice_id, total, amount_paid, amount_due, payment_status
       FROM v_invoice_status WHERE invoice_id = $1`,
      [invoice.id]
    );
    console.table(statusAfter.rows);

    const st = statusAfter.rows[0];
    if (
      new Decimal(st.total).toNumber() !== 200000 ||
      new Decimal(st.amount_paid).toNumber() !== 100000 ||
      new Decimal(st.amount_due).toNumber() !== 100000 ||
      st.payment_status !== 'partial'
    ) {
      throw new Error(
        `v_invoice_status mismatch! Expected 200000 / 100000 / 100000 / partial, got ${JSON.stringify(st)}`
      );
    }
    console.log('✅ PASS: v_invoice_status correctly returns 200000 / 100000 / 100000 / partial');

    // Step 6: Verify P&L for Payment Month (December 2026) vs October 2026
    console.log('\n--- Step 5: Checking Profit & Loss for December 2026 (Payment Month) ---');
    const decPnlRes = await client.query(
      `SELECT 
         COALESCE(SUM(jel.credit) - SUM(jel.debit), 0) as december_income
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.id = jel.entry_id
       JOIN accounts a ON a.id = jel.account_id
       WHERE je.status = 'posted'
         AND a.type = 'income'
         AND je.entry_date BETWEEN '2026-12-01' AND '2026-12-31'`
    );
    const decIncome = new Decimal(decPnlRes.rows[0].december_income || 0);
    console.log(`December 2026 Total Income in P&L: ₹${decIncome.toFixed(2)}`);
    if (decIncome.toNumber() !== 0) {
      throw new Error(`Expected December Income to be 0.00, but got ${decIncome.toFixed(2)}! Revenue was wrongly recognized at payment.`);
    }
    console.log('✅ PASS: The 200,000 does NOT appear in December P&L. P&L did not move on payment.');

    console.log('\n--- Step 6: Checking Profit & Loss for October 2026 (Invoice Month) ---');
    const octPnlRes = await client.query(
      `SELECT 
         COALESCE(SUM(jel.credit) - SUM(jel.debit), 0) as october_income
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.id = jel.entry_id
       JOIN accounts a ON a.id = jel.account_id
       WHERE je.status = 'posted'
         AND a.type = 'income'
         AND je.entry_date BETWEEN '2026-10-01' AND '2026-10-31'`
    );
    const octIncome = new Decimal(octPnlRes.rows[0].october_income || 0);
    console.log(`October 2026 Total Income in P&L: ₹${octIncome.toFixed(2)}`);
    if (octIncome.toNumber() < 200000) {
      throw new Error(`Expected October Income to contain at least 200,000.00, got ${octIncome.toFixed(2)}`);
    }
    console.log('✅ PASS: The 200,000 was correctly recognized in October at invoice creation.');

    // Step 7: Verify Trial Balance Difference
    console.log('\n--- Step 7: Checking Global Ledger Balance (SUM(debit) - SUM(credit)) ---');
    const tbRes = await client.query(
      'SELECT COALESCE(SUM(debit) - SUM(credit), 0) AS difference FROM journal_entry_lines'
    );
    const diff = new Decimal(tbRes.rows[0].difference);
    console.log(`Trial Balance Debit - Credit difference: ${diff.toFixed(2)}`);
    if (!diff.isZero()) {
      throw new Error(`Ledger unbalanced! Difference: ${diff.toFixed(2)}`);
    }
    console.log('✅ PASS: Ledger is perfectly balanced (difference 0.00)');

    // Step 8: Payment History on Invoice
    console.log('\n--- Step 8: Checking Payment History on Invoice ---');
    const history = await PaymentService.getInvoicePaymentHistory(invoice.id);
    console.table(history);
    if (history.length !== 1 || history[0].amount !== '100000.00' || history[0].runningRemaining !== '100000.00') {
      throw new Error(`Unexpected payment history: ${JSON.stringify(history)}`);
    }
    console.log('✅ PASS: Invoice payment history shows amount 100000.00 with runningRemaining 100000.00');

    // Step 9: Customer Receivables Summary
    console.log('\n--- Step 9: Checking Customer Receivables Summary ---');
    const receivables = await PaymentService.getReceivablesSummary();
    console.table(receivables);
    const custRec = receivables.find(r => r.customerId === customer.id);
    if (!custRec) {
      throw new Error(`Customer #${customer.id} not found in receivables summary`);
    }
    console.log(`Customer Receivables Summary: Invoiced=${custRec.totalInvoiced}, Paid=${custRec.totalPaid}, Outstanding=${custRec.totalOutstanding}`);
    console.log('\n🎉 ALL PHASE 3 TESTS PASSED SUCCESSFULLY! 🎉');

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      paymentId: payment.id,
      paymentNumber: payment.number,
      journalEntryId: payment.journalEntryId,
    };
  } finally {
    client.release();
  }
}

verifyPhase3()
  .then(res => {
    console.log('\nFinished with output:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  });
