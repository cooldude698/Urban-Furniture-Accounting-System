import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/urban';

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    await client.query('BEGIN');
    const cash = await client.query(`SELECT id FROM accounts WHERE name = 'Cash'`);
    const capital = await client.query(`SELECT id FROM accounts WHERE name = 'Capital'`);
    const journal = await client.query(`SELECT id FROM journals WHERE name = 'Cash'`);

    const entry = await client.query(
      `INSERT INTO journal_entries (number, journal_id, reference, status) VALUES ($1, $2, $3, 'draft') RETURNING id`,
      [`PG-RAW-UNBALANCED-${Date.now()}`, journal.rows[0].id, 'pg raw unbalanced test']
    );
    const entryId = entry.rows[0].id;

    await client.query(
      `INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES ($1, $2, 100.00, 0)`,
      [entryId, cash.rows[0].id]
    );
    await client.query(
      `INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES ($1, $2, 0, 40.00)`,
      [entryId, capital.rows[0].id]
    );
    await client.query(`UPDATE journal_entries SET status = 'posted' WHERE id = $1`, [entryId]);

    console.log('About to COMMIT an unbalanced posted entry via raw pg...');
    await client.query('COMMIT');
    console.log('COMMIT resolved without throwing — THIS WOULD BE A BUG.');
  } catch (err: any) {
    console.log('COMMIT (or a statement) threw as expected:', err.message);
    try { await client.query('ROLLBACK'); } catch {}
  } finally {
    const check = await client.query(
      `SELECT COUNT(*)::int AS count FROM journal_entries WHERE reference = 'pg raw unbalanced test'`
    );
    console.log('Orphan rows left behind:', check.rows[0].count, '(must be 0)');
    await client.end();
  }
}

main();
