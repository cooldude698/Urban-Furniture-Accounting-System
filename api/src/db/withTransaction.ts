import { PoolClient } from 'pg';
import { pool } from './pool';

export interface TransactionClient extends PoolClient {
  _postCommitHooks?: Array<() => Promise<void> | void>;
}

export async function withTransaction<T>(
  callback: (client: TransactionClient) => Promise<T>
): Promise<T> {
  const client = (await pool.connect()) as TransactionClient;
  client._postCommitHooks = [];
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');

    const hooks = client._postCommitHooks || [];
    for (const hook of hooks) {
      try {
        await hook();
      } catch (hookErr) {
        console.error('Post-commit hook error:', hookErr);
      }
    }

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    delete client._postCommitHooks;
    client.release();
  }
}

