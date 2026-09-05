import { pool } from '../src/db/pool';

/**
 * Phase 7: Seed 50,000 balanced journal lines into PostgreSQL.
 * Uses batch inserts for maximum ingestion speed.
 */
async function seed50k() {
  console.log('=== Seeding 50,000 Journal Lines for Performance Testing ===');

  const client = await pool.connect();
  try {
    const checkRes = await client.query('SELECT COUNT(*) AS cnt FROM journal_entry_lines');
    const existingCount = parseInt(checkRes.rows[0].cnt, 10);
    console.log(`Current journal_entry_lines count: ${existingCount}`);

    const targetLines = 50000;
    const entriesToCreate = targetLines / 2; // 25,000 entries of 2 lines = 50,000 lines
    const batchSize = 1000; // 1,000 entries per batch

    console.log(`Generating ${entriesToCreate} balanced entries (total ${targetLines} lines)...`);

    const startTime = Date.now();

    for (let b = 0; b < entriesToCreate; b += batchSize) {
      const currentBatchCount = Math.min(batchSize, entriesToCreate - b);

      await client.query('BEGIN');

      // Create entries in batch
      const entryNumbers: string[] = [];
      const journalIds: number[] = [];
      const entryDates: string[] = [];
      const statuses: string[] = [];
      const references: string[] = [];

      for (let i = 0; i < currentBatchCount; i++) {
        const num = `JE/PERF/${String(b + i + 1).padStart(6, '0')}`;
        entryNumbers.push(num);
        journalIds.push((i % 4) + 1); // journals 1 to 4
        // Date between 2026-01-01 and 2026-09-05
        const day = (i % 240) + 1;
        const d = new Date(2026, 0, day);
        entryDates.push(d.toISOString().split('T')[0]);
        statuses.push('posted');
        references.push(`Perf Load Test Batch ${b + i + 1}`);
      }

      const insertEntriesQuery = `
        INSERT INTO journal_entries (number, journal_id, entry_date, status, reference)
        SELECT * FROM UNNEST(
          $1::text[],
          $2::int[],
          $3::date[],
          $4::text[],
          $5::text[]
        )
        RETURNING id;
      `;

      const entriesRes = await client.query(insertEntriesQuery, [
        entryNumbers,
        journalIds,
        entryDates,
        statuses,
        references,
      ]);

      const entryIds = entriesRes.rows.map((r: { id: number }) => r.id);

      // Now prepare 2 balanced lines for each entry (e.g. DR Expense / CR Bank or DR Debtors / CR Income)
      const lineEntryIds: number[] = [];
      const lineAccountIds: number[] = [];
      const lineDebits: string[] = [];
      const lineCredits: string[] = [];
      const lineDescriptions: string[] = [];

      for (let i = 0; i < entryIds.length; i++) {
        const eId = entryIds[i];
        const amount = ((i % 500) + 10).toFixed(2);

        if (i % 2 === 0) {
          // DR Purchase Expense (6), CR Bank (1)
          lineEntryIds.push(eId, eId);
          lineAccountIds.push(6, 1);
          lineDebits.push(amount, '0.00');
          lineCredits.push('0.00', amount);
          lineDescriptions.push('Perf Test Line DR', 'Perf Test Line CR');
        } else {
          // DR Debtors (3), CR Sales Income (5)
          lineEntryIds.push(eId, eId);
          lineAccountIds.push(3, 5);
          lineDebits.push(amount, '0.00');
          lineCredits.push('0.00', amount);
          lineDescriptions.push('Perf Test Line DR', 'Perf Test Line CR');
        }
      }

      const insertLinesQuery = `
        INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description)
        SELECT * FROM UNNEST(
          $1::int[],
          $2::int[],
          $3::numeric(14,2)[],
          $4::numeric(14,2)[],
          $5::text[]
        );
      `;

      await client.query(insertLinesQuery, [
        lineEntryIds,
        lineAccountIds,
        lineDebits,
        lineCredits,
        lineDescriptions,
      ]);

      await client.query('COMMIT');

      process.stdout.write(`Inserted ${b + currentBatchCount} / ${entriesToCreate} entries (${(b + currentBatchCount) * 2} lines)...\r`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Seeding complete in ${elapsed}s!`);

    const finalRes = await client.query(`
      SELECT 
        COUNT(*) AS total_lines,
        COALESCE(SUM(debit), 0)::text AS total_debit,
        COALESCE(SUM(credit), 0)::text AS total_credit,
        (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0))::text AS diff
      FROM journal_entry_lines;
    `);

    console.log('\nFinal Ledger Summary:');
    console.log(`Total Lines: ${finalRes.rows[0].total_lines}`);
    console.log(`Total Debit: ${finalRes.rows[0].total_debit}`);
    console.log(`Total Credit: ${finalRes.rows[0].total_credit}`);
    console.log(`Balance Difference: ${finalRes.rows[0].diff}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding lines:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed50k().catch((e) => {
  console.error(e);
  process.exit(1);
});
