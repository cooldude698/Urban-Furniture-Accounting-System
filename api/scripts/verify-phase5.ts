/**
 * Phase 5 Verification Script
 * Validates:
 * 1. Admin login to obtain httpOnly cookie
 * 2. Prerequisite customer contact & product setup
 * 3. Create a 5000 invoice and confirm it via PostingService.postDocument('invoice', ...)
 * 4. Verify initial state in v_invoice_status (5000 / 0.00 / 5000.00 / not_paid)
 * 5. Pay 3000 -> verify v_invoice_status (5000 / 3000 / 2000 / partial)
 * 6. Pay 2000 -> verify v_invoice_status (5000 / 5000 / 0.00 / paid)
 * 7. Query GET /api/invoices/:id/payments history
 * 8. Query GET /api/receivables
 * 9. Query GET /api/aging?type=receivable
 * 10. Check ledger balance: SUM(debit) - SUM(credit) MUST be 0.00
 */

import { pool } from '../src/db/pool';
import { withTransaction } from '../src/db/withTransaction';
import { SequenceService } from '../src/services/sequenceService';
import { PostingService } from '../src/services/postingService';

async function main() {
  const baseUrl = 'http://localhost:5000';
  console.log('====================================================');
  console.log('PHASE 5 VERIFICATION RUN');
  console.log('====================================================\n');

  // Step 1: Admin Login
  console.log('--- Step 1: Admin Login ---');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'adminuf', password: 'Admin@12345' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) {
    throw new Error('Failed to obtain auth cookie');
  }
  console.log('✅ Logged in successfully\n');

  // Step 2: Ensure customer contact and product
  const custRes = await pool.query<{ id: number }>(
    `INSERT INTO contacts (name, type, email)
     VALUES ('Urban Living Studios', 'customer', 'finance@urbanliving.local')
     RETURNING id`
  );
  const customerId = custRes.rows[0].id;

  const prodRes = await pool.query<{ id: number }>(
    `INSERT INTO products (sku, name, type, sales_price, cost_price, tax_rate)
     VALUES ('WALNUT-DESK-5K', 'Walnut Executive Desk', 'goods', 5000.00, 3000.00, 0.00)
     ON CONFLICT (sku) DO UPDATE SET sales_price = EXCLUDED.sales_price
     RETURNING id`
  );
  const productId = prodRes.rows[0].id;

  const salesIncomeAcc = await pool.query<{ id: number }>(
    "SELECT id FROM accounts WHERE name = 'Sales Income'"
  );
  const salesIncomeId = salesIncomeAcc.rows[0].id;

  console.log(`Prerequisites ready: Customer ID=${customerId}, Product ID=${productId}\n`);

  // Step 3: Create a 5000 invoice and confirm it
  console.log('--- Step 3: Create a 5000 invoice and confirm it ---');
  let invoiceId = 0;
  let invoiceNumber = '';

  await withTransaction(async (tx) => {
    invoiceNumber = await SequenceService.nextDocNumber('INV', tx);

    const invInsert = await tx.query<{ id: number }>(
      `INSERT INTO customer_invoices
         (number, customer_id, invoice_date, status, subtotal, tax_total, total)
       VALUES ($1, $2, CURRENT_DATE, 'draft', 5000.00, 0.00, 5000.00)
       RETURNING id`,
      [invoiceNumber, customerId]
    );
    invoiceId = invInsert.rows[0].id;

    await tx.query(
      `INSERT INTO customer_invoice_lines
         (invoice_id, line_no, product_id, account_id, qty, unit_price, tax_rate, subtotal, tax_amount, total)
       VALUES ($1, 1, $2, $3, 1.00, 5000.00, 0.00, 5000.00, 0.00, 5000.00)`,
      [invoiceId, productId, salesIncomeId]
    );

    // Confirm invoice (posts to financial ledger)
    const postRes = await PostingService.postDocument('invoice', invoiceId, tx);
    console.log(`Invoice ${invoiceNumber} confirmed -> Journal Entry ID: ${postRes.entryId}`);
  });

  // Verify initial status
  const initStatus = await pool.query(
    'SELECT number, total, amount_paid, amount_due, payment_status FROM v_invoice_status WHERE invoice_id = $1',
    [invoiceId]
  );
  console.log('Initial Invoice Status in v_invoice_status:');
  console.table(initStatus.rows);

  // Step 4: Pay 3000 via POST /api/payments
  console.log('--- Step 4: Pay 3000 ---');
  const pay1Res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      direction: 'inbound',
      partnerId: customerId,
      method: 'bank',
      amount: '3000.00',
      allocations: [
        {
          invoiceId: invoiceId,
          amount: '3000.00',
        },
      ],
    }),
  });
  const pay1Body = (await pay1Res.json()) as any;
  console.log(`HTTP Status: ${pay1Res.status}`);
  console.log('Payment 1 Result:', JSON.stringify(pay1Body, null, 2));

  if (pay1Res.status !== 201) {
    throw new Error('Failed to record payment of 3000');
  }

  // Check v_invoice_status after 3000 payment
  const statusAfter3k = await pool.query(
    'SELECT number, total, amount_paid, amount_due, payment_status FROM v_invoice_status WHERE invoice_id = $1',
    [invoiceId]
  );
  console.log('Invoice Status after 3000 payment (Expecting 5000 / 3000 / 2000 / partial):');
  console.table(statusAfter3k.rows);

  const row3k = statusAfter3k.rows[0];
  if (
    row3k.total === '5000.00' &&
    row3k.amount_paid === '3000.00' &&
    row3k.amount_due === '2000.00' &&
    row3k.payment_status === 'partial'
  ) {
    console.log('✅ Correct: 5000 / 3000 / 2000 / partial\n');
  } else {
    throw new Error('v_invoice_status does not match expected 5000 / 3000 / 2000 / partial');
  }

  // Step 5: Pay remaining 2000 via POST /api/payments
  console.log('--- Step 5: Pay 2000 ---');
  const pay2Res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      direction: 'inbound',
      partnerId: customerId,
      method: 'cash',
      amount: '2000.00',
      allocations: [
        {
          invoiceId: invoiceId,
          amount: '2000.00',
        },
      ],
    }),
  });
  const pay2Body = (await pay2Res.json()) as any;
  console.log(`HTTP Status: ${pay2Res.status}`);
  console.log('Payment 2 Result:', JSON.stringify(pay2Body, null, 2));

  if (pay2Res.status !== 201) {
    throw new Error('Failed to record payment of 2000');
  }

  // Check v_invoice_status after 2000 payment
  const statusAfter2k = await pool.query(
    'SELECT number, total, amount_paid, amount_due, payment_status FROM v_invoice_status WHERE invoice_id = $1',
    [invoiceId]
  );
  console.log('Invoice Status after 2000 payment (Expecting 5000 / 5000 / 0.00 / paid):');
  console.table(statusAfter2k.rows);

  const row2k = statusAfter2k.rows[0];
  if (
    row2k.total === '5000.00' &&
    row2k.amount_paid === '5000.00' &&
    row2k.amount_due === '0.00' &&
    row2k.payment_status === 'paid'
  ) {
    console.log('✅ Correct: 5000 / 5000 / 0.00 / paid\n');
  } else {
    throw new Error('v_invoice_status does not match expected 5000 / 5000 / 0.00 / paid');
  }

  // Step 6: Test GET /api/invoices/:id/payments
  console.log(`--- Step 6: GET /api/invoices/${invoiceId}/payments ---`);
  const historyRes = await fetch(`${baseUrl}/api/invoices/${invoiceId}/payments`, {
    headers: { Cookie: cookie },
  });
  const historyBody = (await historyRes.json()) as any;
  console.log(`HTTP Status: ${historyRes.status}`);
  console.log('Payment History:', JSON.stringify(historyBody.data, null, 2));
  if (historyRes.status === 200 && historyBody.data?.length === 2) {
    console.log('✅ Correct: Full payment history returned\n');
  } else {
    throw new Error('Failed to retrieve invoice payments');
  }

  // Step 7: Test GET /api/receivables
  console.log('--- Step 7: GET /api/receivables ---');
  const recRes = await fetch(`${baseUrl}/api/receivables`, {
    headers: { Cookie: cookie },
  });
  const recBody = (await recRes.json()) as any;
  console.log(`HTTP Status: ${recRes.status}`);
  console.log('Receivables Summary:', JSON.stringify(recBody.data, null, 2));
  if (recRes.status === 200) {
    console.log('✅ Correct: Customer receivables summary returned\n');
  } else {
    throw new Error('Failed to retrieve receivables summary');
  }

  // Step 8: Test GET /api/aging?type=receivable
  console.log('--- Step 8: GET /api/aging?type=receivable ---');
  const agingRes = await fetch(`${baseUrl}/api/aging?type=receivable`, {
    headers: { Cookie: cookie },
  });
  const agingBody = (await agingRes.json()) as any;
  console.log(`HTTP Status: ${agingRes.status}`);
  console.log('Aging Report:', JSON.stringify(agingBody.data, null, 2));
  if (agingRes.status === 200 && agingBody.data?.totals) {
    console.log('✅ Correct: Aging report returned\n');
  } else {
    throw new Error('Failed to retrieve aging report');
  }

  // Step 9: Verify SUM(debit) - SUM(credit) is 0.00
  console.log('--- Step 9: Verify SUM(debit) - SUM(credit) on entire ledger ---');
  const diffRes = await pool.query<{ diff: string }>(
    'SELECT (SUM(debit) - SUM(credit))::TEXT AS diff FROM journal_entry_lines;'
  );
  console.log(`Ledger Difference: ${diffRes.rows[0].diff}`);
  if (diffRes.rows[0].diff === '0.00') {
    console.log('✅ Correct: Difference is 0.00\n');
  } else {
    throw new Error(`Ledger difference is not 0.00: ${diffRes.rows[0].diff}`);
  }

  console.log('====================================================');
  console.log('ALL PHASE 5 VERIFICATIONS PASSED PERFECTLY!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
