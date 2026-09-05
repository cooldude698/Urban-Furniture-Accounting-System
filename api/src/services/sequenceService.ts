import { PoolClient } from 'pg';
import { pool } from '../db/pool';

export type SequenceCode = 'PO' | 'BILL' | 'INV' | 'SO' | 'JE' | 'PAY';

export class SequenceService {
  /**
   * Generates the next sequential document number atomically.
   * MUST be called within the caller's transaction to guarantee gapless numbering
   * via PostgreSQL's SELECT ... FOR UPDATE on doc_sequences.
   *
   * @param code The sequence code ('PO' | 'BILL' | 'INV' | 'SO' | 'JE' | 'PAY')
   * @param client The active PoolClient transaction
   */
  static async nextDocNumber(code: SequenceCode, client: PoolClient): Promise<string> {
    const result = await client.query<{ next_doc_number: string }>(
      'SELECT next_doc_number($1) AS next_doc_number',
      [code]
    );

    if (!result.rows[0]?.next_doc_number) {
      throw new Error(`Failed to generate document sequence for code: ${code}`);
    }

    return result.rows[0].next_doc_number;
  }

  /**
   * Standalone helper when no outer transaction exists (spawns its own transaction).
   */
  static async getNextNumberStandalone(code: SequenceCode): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const num = await this.nextDocNumber(code, client);
      await client.query('COMMIT');
      return num;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
