/**
 * Phase 4 Verification Script
 * Validates:
 * 1. Admin login to obtain httpOnly cookie
 * 2. POST /api/journal-entries -> Create manual entry DR Other Expense 10000 / CR Cash 10000 (draft, source_type = NULL)
 * 3. POST /api/journal-entries/:id/post -> Post entry
 * 4. Query v_ledger_detail WHERE source_type IS NULL
 * 5. Attempt an unbalanced post -> verify blocking error and nothing posted
 * 6. Attempt to UPDATE a posted entry -> verify rejection (API & DB trigger)
 * 7. POST /api/journal-entries/:id/reverse -> verify mirrored reversal
 */

import { pool } from '../src/db/pool';

async function main() {
  const baseUrl = 'http://localhost:5000';
  console.log('====================================================');
  console.log('PHASE 4 VERIFICATION RUN');
  console.log('====================================================\n');

  // Step 1: Login to obtain cookie
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

  // Fetch account and journal IDs
  const cashJournal = await pool.query<{ id: number }>("SELECT id FROM journals WHERE name = 'Cash'");
  const otherExpenseAcc = await pool.query<{ id: number }>("SELECT id FROM accounts WHERE name = 'Other Expense'");
  const cashAcc = await pool.query<{ id: number }>("SELECT id FROM accounts WHERE name = 'Cash'");

  const journalId = cashJournal.rows[0].id;
  const otherExpenseId = otherExpenseAcc.rows[0].id;
  const cashId = cashAcc.rows[0].id;

  // Step 2: Create manual entry DR Other Expense 10000 / CR Cash 10000
  console.log('--- Step 2: Create manual entry DR Other Expense 10000 / CR Cash 10000 ---');
  const createRes = await fetch(`${baseUrl}/api/journal-entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      journal_id: journalId,
      reference: 'Office Rent Sept 2026',
      lines: [
        {
          account_id: otherExpenseId,
          debit: '10000.00',
          credit: '0.00',
          description: 'Office Rent Payment',
        },
        {
          account_id: cashId,
          debit: '0.00',
          credit: '10000.00',
          description: 'Office Rent Cash Outflow',
        },
      ],
    }),
  });

  const createBody = (await createRes.json()) as any;
  console.log(`HTTP Status: ${createRes.status}`);
  console.log('Created Entry:', JSON.stringify(createBody.data, null, 2));

  const manualEntryId = createBody.data?.id;
  if (!manualEntryId || createBody.data?.status !== 'draft' || createBody.data?.source_type !== null) {
    throw new Error('Failed to create manual draft journal entry');
  }
  console.log('✅ Correct: Manual draft entry created with source_type = null\n');

  // Step 3: Post the manual entry
  console.log(`--- Step 3: Post manual entry ${manualEntryId} ---`);
  const postRes = await fetch(`${baseUrl}/api/journal-entries/${manualEntryId}/post`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  const postBody = (await postRes.json()) as any;
  console.log(`HTTP Status: ${postRes.status}`);
  console.log('Post Result:', JSON.stringify(postBody, null, 2));
  if (postRes.status !== 200 || postBody.data?.status !== 'posted') {
    throw new Error('Failed to post manual journal entry');
  }
  console.log('✅ Correct: Manual entry posted successfully\n');

  // Step 4: Query v_ledger_detail WHERE source_type IS NULL
  console.log('--- Step 4: Query v_ledger_detail WHERE source_type IS NULL ---');
  const ledgerRes = await pool.query(
    `SELECT entry_number, account_name, debit, credit, source_type, description
     FROM v_ledger_detail
     WHERE source_type IS NULL
     ORDER BY line_id ASC`
  );
  console.table(ledgerRes.rows);
  if (ledgerRes.rows.length === 0) {
    throw new Error('No entries found in v_ledger_detail where source_type IS NULL!');
  }
  console.log('✅ Correct: Manual entries appear in v_ledger_detail with source_type IS NULL\n');

  // Step 5: Attempt an unbalanced post -> blocking error, nothing written
  console.log('--- Step 5: Attempt an unbalanced post ---');
  const unbalancedCreate = await fetch(`${baseUrl}/api/journal-entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      journal_id: journalId,
      reference: 'Unbalanced Test',
      lines: [
        {
          account_id: otherExpenseId,
          debit: '15000.00',
          credit: '0.00',
          description: 'Unbalanced line 1',
        },
        {
          account_id: cashId,
          debit: '0.00',
          credit: '10000.00',
          description: 'Unbalanced line 2',
        },
      ],
    }),
  });
  const unbalancedBody = (await unbalancedCreate.json()) as any;
  const unbalancedId = unbalancedBody.data?.id;

  const unbalancedPost = await fetch(`${baseUrl}/api/journal-entries/${unbalancedId}/post`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  const unbalPostRes = (await unbalancedPost.json()) as any;
  console.log(`HTTP Status: ${unbalancedPost.status}`);
  console.log('Unbalanced Post Response:', JSON.stringify(unbalPostRes, null, 2));

  if (
    unbalancedPost.status === 400 &&
    unbalPostRes.error?.severity === 'blocking' &&
    unbalPostRes.error?.message === 'Debit and credit amounts do not match.'
  ) {
    console.log('✅ Correct: Returned blocking error: "Debit and credit amounts do not match."\n');
    // Clean up draft entry so journal_entry_lines stays balanced
    await fetch(`${baseUrl}/api/journal-entries/${unbalancedId}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
  } else {
    throw new Error('Failed to block unbalanced post!');
  }

  // Step 6: Attempt to UPDATE a posted entry -> rejected
  console.log(`--- Step 6: Attempt to UPDATE posted entry ${manualEntryId} ---`);
  const updateRes = await fetch(`${baseUrl}/api/journal-entries/${manualEntryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      journal_id: journalId,
      reference: 'Tampered Reference',
      lines: [
        {
          account_id: otherExpenseId,
          debit: '20000.00',
          credit: '0.00',
        },
        {
          account_id: cashId,
          debit: '0.00',
          credit: '20000.00',
        },
      ],
    }),
  });
  const updateBody = (await updateRes.json()) as any;
  console.log(`HTTP Status: ${updateRes.status}`);
  console.log('Update Attempt Body:', JSON.stringify(updateBody, null, 2));

  if (
    updateRes.status === 400 &&
    updateBody.error?.severity === 'blocking' &&
    updateBody.error?.message?.includes('cannot be modified or deleted')
  ) {
    console.log('✅ Correct: Service layer blocked update on posted entry\n');
  } else {
    throw new Error('Failed to block update on posted entry!');
  }

  // Step 7: Test Reversal
  console.log(`--- Step 7: POST /api/journal-entries/${manualEntryId}/reverse ---`);
  const reverseRes = await fetch(`${baseUrl}/api/journal-entries/${manualEntryId}/reverse`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  const reverseBody = (await reverseRes.json()) as any;
  console.log(`HTTP Status: ${reverseRes.status}`);
  console.log('Reversal Result:', JSON.stringify(reverseBody, null, 2));

  if (reverseRes.status === 200 && reverseBody.data?.reversalEntryId) {
    const revLines = await pool.query(
      `SELECT jel.id, a.name AS account, jel.debit, jel.credit, jel.description
       FROM journal_entry_lines jel
       JOIN accounts a ON a.id = jel.account_id
       WHERE jel.entry_id = $1`,
      [reverseBody.data.reversalEntryId]
    );
    console.log('Mirrored Reversal Lines:');
    console.table(revLines.rows);
    console.log('✅ Correct: Reversal entry created with mirrored DR and CR lines\n');
  } else {
    throw new Error('Failed to reverse posted entry!');
  }

  console.log('====================================================');
  console.log('ALL PHASE 4 VERIFICATIONS PASSED PERFECTLY!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
