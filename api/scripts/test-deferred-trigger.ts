// CRITICAL Phase 1 verification (AGENT_vedesh.md):
// Does the DEFERRABLE INITIALLY DEFERRED constraint trigger survive Prisma's
// interactive $transaction (BEGIN ... COMMIT over the same connection)?
//
// FINDING (Prisma 5.22.0 + Postgres 16): NO. Postgres correctly rejects the
// COMMIT and rolls back (0 orphan rows — data integrity is fine), but Prisma's
// $transaction() promise RESOLVES instead of rejecting, logging only
// "prisma:error transaction failed to commit" internally. Calling code
// awaiting $transaction(...) would believe an unbalanced entry posted
// successfully. See scripts/debug-deferred.ts for the query-level trace.
//
// DECISION: postingService (and anything else that flips journal_entries.status
// to 'posted' inside a multi-statement transaction) uses a raw `pg` transaction,
// not Prisma's $transaction — see scripts/test-pg-raw.ts, which confirms raw pg
// correctly rejects on COMMIT. Prisma Client is still used for ordinary
// non-transactional reads/writes elsewhere. This is documented in
// docs/POSTING_API.md and must be relayed to Aman and Aryan, since they open
// the transaction that postDocument() runs inside.
//
// Run: npx ts-node scripts/test-deferred-trigger.ts
// Expect: Test 1 PASSED, Test 2 FAILED (that failure IS the finding above —
// this script is kept as a regression check that Prisma's behavior here
// hasn't silently changed).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cashAccount = await prisma.accounts.findFirstOrThrow({ where: { name: 'Cash' } });
  const capitalAccount = await prisma.accounts.findFirstOrThrow({ where: { name: 'Capital' } });
  const cashJournal = await prisma.journals.findFirstOrThrow({ where: { name: 'Cash' } });

  // --- Test 1: balanced entry created line-by-line inside $transaction must commit ---
  const balancedResult = await prisma.$transaction(async (tx) => {
    const entry = await tx.journal_entries.create({
      data: {
        number: `PRISMA-TEST-BALANCED-${Date.now()}`,
        journal_id: cashJournal.id,
        reference: 'prisma balanced test',
        status: 'draft',
      },
    });
    await tx.journal_entry_lines.create({
      data: { entry_id: entry.id, account_id: cashAccount.id, debit: '10.00', credit: '0' },
    });
    await tx.journal_entry_lines.create({
      data: { entry_id: entry.id, account_id: capitalAccount.id, debit: '0', credit: '10.00' },
    });
    await tx.journal_entries.update({ where: { id: entry.id }, data: { status: 'posted' } });
    return entry.id;
  });
  console.log(`Test 1 PASSED: balanced entry ${balancedResult} committed through Prisma's $transaction.`);

  // --- Test 2: unbalanced entry inside $transaction must be rejected AT COMMIT, not earlier ---
  let test2Threw = false;
  let test2Message = '';
  try {
    await prisma.$transaction(async (tx) => {
      const entry = await tx.journal_entries.create({
        data: {
          number: `PRISMA-TEST-UNBALANCED-${Date.now()}`,
          journal_id: cashJournal.id,
          reference: 'prisma unbalanced test',
          status: 'draft',
        },
      });
      // Each of these individual statements must succeed — the constraint is
      // deferred, so per-statement imbalance is fine. Only commit rejects it.
      await tx.journal_entry_lines.create({
        data: { entry_id: entry.id, account_id: cashAccount.id, debit: '100.00', credit: '0' },
      });
      console.log('  intermediate insert (debit-only) succeeded inside the transaction, as expected for a deferred constraint');
      await tx.journal_entry_lines.create({
        data: { entry_id: entry.id, account_id: capitalAccount.id, debit: '0', credit: '40.00' },
      });
      await tx.journal_entries.update({ where: { id: entry.id }, data: { status: 'posted' } });
      // No error yet — Prisma is about to COMMIT. That's where it must fail.
    });
  } catch (err: any) {
    test2Threw = true;
    test2Message = err.message ?? String(err);
  }

  if (test2Threw) {
    console.log(`Test 2 PASSED: unbalanced entry was rejected by Prisma's $transaction commit.\n  Error surfaced: ${test2Message.split('\n')[0]}`);
  } else {
    console.error('Test 2 FAILED: unbalanced entry committed successfully. The deferred trigger did not fire through Prisma.');
    process.exitCode = 1;
  }

  // --- Confirm no orphan rows from the failed transaction ---
  const orphanCount = await prisma.journal_entries.count({ where: { reference: 'prisma unbalanced test' } });
  console.log(`Orphan check: ${orphanCount} rows left behind by the failed transaction (must be 0).`);
  if (orphanCount !== 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('Unexpected error running the test script:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
