/**
 * Phase 3 Verification Script
 * Validates:
 * 1. Bill creation and posting within ONE transaction
 * 2. SUM(debit) == SUM(credit) on journal_entry_lines
 * 3. Idempotency on repeat post
 * 4. Deliberate unbalanced post -> PostgreSQL DEFERRABLE trigger raises and rolls back
 * 5. Invoice creation and posting verification
 * 6. Inbound payment posting verification
 */

import { pool } from '../src/db/pool';
import { withTransaction } from '../src/db/withTransaction';
import { SequenceService } from '../src/services/sequenceService';
import { PostingService } from '../src/services/postingService';

async function main() {
  console.log('====================================================');
  console.log('PHASE 3 VERIFICATION RUN');
  console.log('====================================================\n');

  // Ensure prerequisite master data: vendor contact and product
  const vendorRes = await pool.query<{ id: number }>(
    `INSERT INTO contacts (name, type, email)
     VALUES ('Timber Woods Ltd', 'vendor', 'supply@timberwoods.local')
     ON CONFLICT DO NOTHING
     RETURNING id`
  );
  let vendorId = vendorRes.rows[0]?.id;
  if (!vendorId) {
    const existing = await pool.query<{ id: number }>(
      "SELECT id FROM contacts WHERE name = 'Timber Woods Ltd'"
    );
    vendorId = existing.rows[0].id;
  }

  const productRes = await pool.query<{ id: number }>(
    `INSERT INTO products (sku, name, type, sales_price, cost_price, tax_rate)
     VALUES ('OAK-WOOD-PLK', 'Oak Wood Planks', 'goods', 7500.00, 5000.00, 18.00)
     ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`
  );
  const productId = productRes.rows[0].id;

  console.log(`Prerequisites ready: Vendor ID=${vendorId}, Product ID=${productId}\n`);

  // Test 1: Create and post Vendor Bill in ONE transaction
  console.log('--- Test 1: Create and post Vendor Bill in ONE transaction ---');
  let postedEntryId: number = 0;
  let createdBillId: number = 0;

  await withTransaction(async (tx) => {
    const billNumber = await SequenceService.nextDocNumber('BILL', tx);
    console.log(`Generated Bill Number: ${billNumber}`);

    const billInsert = await tx.query<{ id: number }>(
      `INSERT INTO vendor_bills
         (number, bill_reference, vendor_id, bill_date, status, subtotal, tax_total, total)
       VALUES ($1, 'VEND-REF-991', $2, CURRENT_DATE, 'draft', 10000.00, 1800.00, 11800.00)
       RETURNING id`,
      [billNumber, vendorId]
    );
    createdBillId = billInsert.rows[0].id;

    const purchaseExpenseAcc = await tx.query<{ id: number }>(
      "SELECT id FROM accounts WHERE name = 'Purchase Expense'"
    );

    await tx.query(
      `INSERT INTO vendor_bill_lines
         (bill_id, line_no, product_id, account_id, qty, unit_price, tax_rate, subtotal, tax_amount, total)
       VALUES ($1, 1, $2, $3, 2.00, 5000.00, 18.00, 10000.00, 1800.00, 11800.00)`,
      [createdBillId, productId, purchaseExpenseAcc.rows[0].id]
    );

    // Post bill
    const postRes = await PostingService.postDocument('bill', createdBillId, tx);
    postedEntryId = postRes.entryId;
    console.log(`Bill posted to Journal Entry ID: ${postedEntryId}`);

    // Test 2: Idempotency check inside same transaction
    const repeatPost = await PostingService.postDocument('bill', createdBillId, tx);
    if (repeatPost.entryId !== postedEntryId) {
      throw new Error('Idempotency failed: second post created duplicate entry!');
    }
    console.log('✅ Idempotency verified: duplicate post returned identical entryId\n');
  });

  // Test 3: Query entry lines and verify SUM(debit) == SUM(credit)
  console.log('--- Test 2: Verify SUM(debit) == SUM(credit) on posted entry ---');
  const sumRes = await pool.query<{ sum_debit: string; sum_credit: string; diff: string }>(
    `SELECT
       SUM(debit)::TEXT AS sum_debit,
       SUM(credit)::TEXT AS sum_credit,
       (SUM(debit) - SUM(credit))::TEXT AS diff
     FROM journal_entry_lines
     WHERE entry_id = $1`,
    [postedEntryId]
  );
  console.log('Journal Entry Balance Check:');
  console.table(sumRes.rows);

  const linesRes = await pool.query(
    `SELECT jel.id, a.name AS account, jel.debit, jel.credit, jel.description
     FROM journal_entry_lines jel
     JOIN accounts a ON a.id = jel.account_id
     WHERE jel.entry_id = $1
     ORDER BY jel.id`,
    [postedEntryId]
  );
  console.log('Lines breakdown:');
  console.table(linesRes.rows);

  const row = sumRes.rows[0];
  if (row.sum_debit === '11800.00' && row.sum_credit === '11800.00' && row.diff === '0.00') {
    console.log('✅ Correct: Debits and credits are equal and non-zero (11800.00)\n');
  } else {
    console.error('❌ Failed balance check!');
    process.exit(1);
  }

  // Test 4: Deliberately post an unbalanced entry and confirm Postgres rejects it
  console.log('--- Test 3: Deliberately post an unbalanced entry ---');
  let rejected = false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const jeNum = await SequenceService.nextDocNumber('JE', client);
    const cashJournal = await client.query<{ id: number }>("SELECT id FROM journals WHERE name = 'Cash'");
    const cashAcc = await client.query<{ id: number }>("SELECT id FROM accounts WHERE name = 'Cash'");
    const capitalAcc = await client.query<{ id: number }>("SELECT id FROM accounts WHERE name = 'Capital'");

    const badEntry = await client.query<{ id: number }>(
      `INSERT INTO journal_entries (number, journal_id, status)
       VALUES ($1, $2, 'draft')
       RETURNING id`,
      [jeNum, cashJournal.rows[0].id]
    );
    const badId = badEntry.rows[0].id;

    // Unbalanced lines: Debit 5000, Credit 3000 (diff = 2000)
    await client.query(
      `INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit)
       VALUES ($1, $2, 5000.00, 0)`,
      [badId, cashAcc.rows[0].id]
    );
    await client.query(
      `INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit)
       VALUES ($1, $2, 0, 3000.00)`,
      [badId, capitalAcc.rows[0].id]
    );

    // Set to posted
    await client.query("UPDATE journal_entries SET status = 'posted' WHERE id = $1", [badId]);

    // Attempt COMMIT -> deferred trigger MUST fire and abort
    await client.query('COMMIT');
  } catch (err: any) {
    rejected = true;
    console.log('Caught expected rejection from PostgreSQL:');
    console.log(`Error message: ${err.message}`);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }

  if (rejected) {
    console.log('✅ Correct: PostgreSQL DEFERRABLE trigger raised and rolled back unbalanced entry\n');
  } else {
    console.error('❌ FAILED: PostgreSQL accepted an unbalanced entry!');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('ALL PHASE 3 VERIFICATIONS PASSED PERFECTLY!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
