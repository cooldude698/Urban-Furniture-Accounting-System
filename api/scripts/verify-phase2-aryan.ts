import { pool } from '../src/db/pool';
import { InvoiceService } from '../src/services/invoiceService';

async function main() {
  console.log('====================================================');
  console.log('ARYAN PHASE 2 VERIFICATION — Customer Invoice');
  console.log('====================================================\n');

  // 1. Prerequisites: Ensure customer and product exist
  const custRes = await pool.query<{ id: number; name: string }>(
    `SELECT id, name FROM contacts WHERE type IN ('customer', 'both') LIMIT 1`
  );
  let customerId = custRes.rows[0]?.id;
  if (!customerId) {
    const newCust = await pool.query<{ id: number }>(
      `INSERT INTO contacts (name, type, email) VALUES ('Urban Elite Homes', 'customer', 'accounts@urbanelite.in') RETURNING id`
    );
    customerId = newCust.rows[0].id;
  }
  const customerName = custRes.rows[0]?.name || 'Urban Elite Homes';

  // Ensure a test product with sales_price = 10000, tax = 0
  const prodRes = await pool.query<{ id: number }>(
    `INSERT INTO products (sku, name, type, sales_price, cost_price, tax_rate)
     VALUES ('TEST-DESK-10K', 'Custom Executive Teak Desk', 'goods', 10000.00, 6000.00, 0.00)
     ON CONFLICT (sku) DO UPDATE SET sales_price = 10000.00, tax_rate = 0.00
     RETURNING id`
  );
  const productId = prodRes.rows[0].id;

  console.log(`Prerequisites: Customer ID=${customerId} (${customerName}), Product ID=${productId} (10,000.00, 0% tax)\n`);

  // Step 1: Create 10,000 invoice with no tax
  console.log('--- Step 1: Create 10,000 invoice with 0% tax in draft ---');
  const invoice = await InvoiceService.createInvoice({
    customerId,
    invoiceDate: '2026-09-05',
    dueDate: '2026-10-05',
    lines: [
      {
        productId,
        qty: '1.00',
        unitPrice: '10000.00',
        taxRate: '0.00',
      },
    ],
  });

  console.log(`Created Invoice: ID=${invoice.id}, Number=${invoice.number}, Status=${invoice.status}, Total=₹${invoice.total}\n`);

  // Step 2: Confirm the invoice
  console.log(`--- Step 2: Confirm Invoice #${invoice.id} (${invoice.number}) ---`);
  const confirmed = await InvoiceService.confirmInvoice(invoice.id);
  console.log(`Confirmed Invoice #${confirmed.id}: Status=${confirmed.status}, Journal Entry ID=${confirmed.journalEntryId}\n`);

  if (!confirmed.journalEntryId) {
    throw new Error('Customer Invoice confirmation did not set journal_entry_id');
  }

  // Step 3: Check journal_entry_lines
  console.log('--- Step 3: Journal Entry Lines Breakdown ---');
  const jeQuery = `
    SELECT 
      a.name as account_name,
      l.partner_id,
      l.debit,
      l.credit,
      l.description
    FROM journal_entry_lines l
    JOIN accounts a ON a.id = l.account_id
    WHERE l.entry_id = $1
    ORDER BY l.id ASC;
  `;
  const linesRes = await pool.query(jeQuery, [confirmed.journalEntryId]);
  console.table(linesRes.rows);

  // Assertions on the lines
  const debtorsLine = linesRes.rows.find(r => r.account_name === 'Debtors');
  const salesIncomeLine = linesRes.rows.find(r => r.account_name === 'Sales Income');

  if (!debtorsLine || Number(debtorsLine.debit) !== 10000 || Number(debtorsLine.credit) !== 0) {
    throw new Error(`Expected DR Debtors 10000.00, got: ${JSON.stringify(debtorsLine)}`);
  }
  console.log('✅ PASS: DR Debtors 10000.00');

  if (Number(debtorsLine.partner_id) !== customerId) {
    throw new Error(`Expected Debtors line partner_id to be customer (${customerId}), got: ${debtorsLine.partner_id}`);
  }
  console.log(`✅ PASS: Debtors line carries partner_id = ${customerId} (the customer)`);

  if (!salesIncomeLine || Number(salesIncomeLine.credit) !== 10000 || Number(salesIncomeLine.debit) !== 0) {
    throw new Error(`Expected CR Sales Income 10000.00, got: ${JSON.stringify(salesIncomeLine)}`);
  }
  console.log('✅ PASS: CR Sales Income 10000.00');

  // Step 4: Ledger balance difference check across all journal_entry_lines
  console.log('\n--- Step 4: Overall Ledger Trial Balance Check ---');
  const diffRes = await pool.query<{ diff: string }>('SELECT SUM(debit)-SUM(credit) AS diff FROM journal_entry_lines');
  const diff = diffRes.rows[0].diff;
  console.log(`SUM(debit) - SUM(credit) across all journal_entry_lines: ${diff}`);

  if (diff === '0.00' || Number(diff) === 0) {
    console.log('✅ PASS: SUM(debit) - SUM(credit) is 0.00');
  } else {
    throw new Error(`Ledger difference is not 0.00! Got: ${diff}`);
  }

  // Step 5: Verify stock_moves (-1 for goods line)
  console.log('\n--- Step 5: Stock Moves Check ---');
  const stockRes = await pool.query(
    `SELECT product_id, qty_change, source_type, source_id
     FROM stock_moves
     WHERE source_type = 'invoice' AND source_id = $1`,
    [invoice.id]
  );
  console.table(stockRes.rows);
  if (stockRes.rows.length === 0 || Number(stockRes.rows[0].qty_change) !== -1) {
    throw new Error(`Expected stock_move of -1 for goods product, got: ${JSON.stringify(stockRes.rows)}`);
  }
  console.log('✅ PASS: Created stock move with -1.00 qty for physical goods line');

  // Step 6: Verify v_invoice_status
  console.log('\n--- Step 6: Status from v_invoice_status View ---');
  const viewRes = await pool.query(
    `SELECT invoice_id, number, total, amount_paid, amount_due, payment_status
     FROM v_invoice_status WHERE invoice_id = $1`,
    [invoice.id]
  );
  console.table(viewRes.rows);
  const statusRow = viewRes.rows[0];
  if (statusRow.payment_status !== 'not_paid' || Number(statusRow.amount_due) !== 10000) {
    throw new Error(`Unexpected v_invoice_status values: ${JSON.stringify(statusRow)}`);
  }
  console.log("✅ PASS: v_invoice_status computed status: payment_status='not_paid', amount_due=10000.00");

  console.log('\n====================================================');
  console.log('ARYAN PHASE 2 VERIFICATION COMPLETE — ALL TESTS PASSED');
  console.log('====================================================');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Verification failed:', err);
    pool.end();
    process.exit(1);
  });
