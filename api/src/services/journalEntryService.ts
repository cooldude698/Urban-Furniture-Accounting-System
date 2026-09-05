import { PoolClient } from 'pg';
import Decimal from 'decimal.js';
import { pool } from '../db/pool';
import { withTransaction } from '../db/withTransaction';
import { SequenceService } from './sequenceService';
import { AuditService } from './auditService';
import { CreateJournalEntryInput } from '../shared/schemas/journalEntry';

export interface JournalEntryListItem {
  id: number;
  date: string;
  number: string;
  partner: string | null;
  journal: string;
  total: string;
  status: string;
  source_type: string | null;
}

export interface JournalEntryLineDetail {
  id: number;
  account_id: number;
  account_name: string;
  account_type: string;
  partner_id: number | null;
  partner_name: string | null;
  analytic_account_id: number | null;
  analytic_account_name: string | null;
  debit: string;
  credit: string;
  description: string | null;
}

export interface JournalEntryDetail {
  id: number;
  number: string;
  journal_id: number;
  journal_name: string;
  entry_date: string;
  reference: string | null;
  status: 'draft' | 'posted';
  source_type: string | null;
  source_id: number | null;
  reversal_of: number | null;
  total: string;
  lines: JournalEntryLineDetail[];
}

export class JournalEntryService {
  /**
   * 1. GET /api/journal-entries list
   */
  static async listEntries(): Promise<JournalEntryListItem[]> {
    const query = `
      SELECT
        je.id,
        je.entry_date::TEXT AS date,
        je.number,
        j.name AS journal,
        je.status,
        je.source_type,
        COALESCE(
          (SELECT c.name FROM journal_entry_lines jel2
           JOIN contacts c ON c.id = jel2.partner_id
           WHERE jel2.entry_id = je.id AND jel2.partner_id IS NOT NULL
           LIMIT 1),
          NULL
        ) AS partner,
        COALESCE(
          (SELECT SUM(jel.debit)::TEXT FROM journal_entry_lines jel WHERE jel.entry_id = je.id),
          '0.00'
        ) AS total
      FROM journal_entries je
      JOIN journals j ON j.id = je.journal_id
      ORDER BY je.entry_date DESC, je.id DESC
    `;

    const res = await pool.query<JournalEntryListItem>(query);
    return res.rows;
  }

  /**
   * 2. GET /api/journal-entries/:id
   */
  static async getEntryById(id: number): Promise<JournalEntryDetail | null> {
    const entryRes = await pool.query<{
      id: number;
      number: string;
      journal_id: number;
      journal_name: string;
      entry_date: string;
      reference: string | null;
      status: 'draft' | 'posted';
      source_type: string | null;
      source_id: number | null;
      reversal_of: number | null;
    }>(
      `SELECT
         je.id,
         je.number,
         je.journal_id,
         j.name AS journal_name,
         je.entry_date::TEXT,
         je.reference,
         je.status,
         je.source_type,
         je.source_id,
         je.reversal_of
       FROM journal_entries je
       JOIN journals j ON j.id = je.journal_id
       WHERE je.id = $1`,
      [id]
    );

    const entry = entryRes.rows[0];
    if (!entry) return null;

    const linesRes = await pool.query<JournalEntryLineDetail>(
      `SELECT
         jel.id,
         jel.account_id,
         a.name AS account_name,
         a.type AS account_type,
         jel.partner_id,
         c.name AS partner_name,
         jel.analytic_account_id,
         aa.name AS analytic_account_name,
         jel.debit::TEXT,
         jel.credit::TEXT,
         jel.description
       FROM journal_entry_lines jel
       JOIN accounts a ON a.id = jel.account_id
       LEFT JOIN contacts c ON c.id = jel.partner_id
       LEFT JOIN analytic_accounts aa ON aa.id = jel.analytic_account_id
       WHERE jel.entry_id = $1
       ORDER BY jel.id ASC`,
      [id]
    );

    let total = new Decimal(0);
    for (const line of linesRes.rows) {
      total = total.plus(new Decimal(line.debit));
    }

    return {
      ...entry,
      total: total.toFixed(2),
      lines: linesRes.rows,
    };
  }

  /**
   * 3. POST /api/journal-entries manual entry, status draft, source_type = NULL
   */
  static async createManualEntry(
    input: CreateJournalEntryInput,
    userId?: number
  ): Promise<JournalEntryDetail> {
    // Validate line checks: either debit > 0 or credit > 0, not both, not neither
    for (const line of input.lines) {
      const d = new Decimal(line.debit || 0);
      const c = new Decimal(line.credit || 0);
      if ((d.isPositive() && !d.isZero() && c.isZero()) || (c.isPositive() && !c.isZero() && d.isZero())) {
        continue;
      }
      throw new Error('Each line must have either debit > 0 or credit > 0, never both, never neither.');
    }

    let createdId = 0;

    await withTransaction(async (tx) => {
      const number = await SequenceService.nextDocNumber('JE', tx);
      const entryDate = input.entry_date || new Date().toISOString().split('T')[0];

      const entryRes = await tx.query<{ id: number }>(
        `INSERT INTO journal_entries
           (number, journal_id, entry_date, reference, status, source_type, source_id, created_by)
         VALUES ($1, $2, $3, $4, 'draft', NULL, NULL, $5)
         RETURNING id`,
        [number, input.journal_id, entryDate, input.reference || null, userId || null]
      );
      createdId = entryRes.rows[0].id;

      for (const line of input.lines) {
        const debitStr = new Decimal(line.debit || 0).toFixed(2);
        const creditStr = new Decimal(line.credit || 0).toFixed(2);

        await tx.query(
          `INSERT INTO journal_entry_lines
             (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            createdId,
            line.account_id,
            line.partner_id || null,
            line.analytic_account_id || null,
            debitStr,
            creditStr,
            line.description || null,
          ]
        );
      }

      await AuditService.log(
        {
          tableName: 'journal_entries',
          recordId: createdId,
          action: 'create',
          userId: userId || null,
          afterData: { number, journalId: input.journal_id },
        },
        tx
      );
    });

    const full = await this.getEntryById(createdId);
    if (!full) throw new Error('Failed to retrieve created journal entry');
    return full;
  }

  /**
   * 4. POST /api/journal-entries/:id/post
   * Blocking validation: If SUM(debit) != SUM(credit), return error with severity 'blocking'
   * and message "Debit and credit amounts do not match."
   */
  static async postEntry(id: number): Promise<{ id: number; status: string }> {
    const entry = await this.getEntryById(id);
    if (!entry) {
      const err = new Error(`Journal entry ${id} not found`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (entry.status === 'posted') {
      return { id, status: 'posted' };
    }

    // Calculate application-level debit and credit sums
    let sumDebit = new Decimal(0);
    let sumCredit = new Decimal(0);

    for (const line of entry.lines) {
      sumDebit = sumDebit.plus(new Decimal(line.debit));
      sumCredit = sumCredit.plus(new Decimal(line.credit));
    }

    if (!sumDebit.equals(sumCredit)) {
      const err = new Error('Debit and credit amounts do not match.');
      (err as any).code = 'UNBALANCED_ENTRY';
      (err as any).severity = 'blocking';
      (err as any).statusCode = 400;
      throw err;
    }

    await withTransaction(async (tx) => {
      await tx.query(
        "UPDATE journal_entries SET status = 'posted' WHERE id = $1 AND status = 'draft'",
        [id]
      );
      await AuditService.log(
        {
          tableName: 'journal_entries',
          recordId: id,
          action: 'post',
          afterData: { status: 'posted' },
        },
        tx
      );
    });

    return { id, status: 'posted' };
  }

  /**
   * 5. POST /api/journal-entries/:id/reverse
   * Creates a mirrored entry with reversal_of set. Original stays posted.
   */
  static async reverseEntry(
    id: number,
    userId?: number
  ): Promise<{ reversalEntryId: number; reversalNumber: string }> {
    const original = await this.getEntryById(id);
    if (!original) {
      const err = new Error(`Journal entry ${id} not found`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (original.status !== 'posted') {
      const err = new Error('Only posted journal entries can be reversed');
      (err as any).code = 'INVALID_STATE';
      (err as any).severity = 'blocking';
      (err as any).statusCode = 400;
      throw err;
    }

    let reversalId = 0;
    let reversalNumber = '';

    await withTransaction(async (tx) => {
      reversalNumber = await SequenceService.nextDocNumber('JE', tx);
      const currentDate = new Date().toISOString().split('T')[0];

      const revRes = await tx.query<{ id: number }>(
        `INSERT INTO journal_entries
           (number, journal_id, entry_date, reference, status, source_type, source_id, reversal_of, created_by)
         VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8)
         RETURNING id`,
        [
          reversalNumber,
          original.journal_id,
          currentDate,
          `Reversal of ${original.number}`,
          original.source_type,
          original.source_id,
          original.id,
          userId || null,
        ]
      );
      reversalId = revRes.rows[0].id;

      // Mirror lines: original DR -> reversal CR, original CR -> reversal DR
      for (const line of original.lines) {
        await tx.query(
          `INSERT INTO journal_entry_lines
             (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            reversalId,
            line.account_id,
            line.partner_id,
            line.analytic_account_id,
            line.credit, // Mirrored: credit becomes debit
            line.debit,  // Mirrored: debit becomes credit
            `Reversal line: ${line.description || original.number}`,
          ]
        );
      }

      // Flip status to posted (validated by deferred trigger at COMMIT)
      await tx.query(
        "UPDATE journal_entries SET status = 'posted' WHERE id = $1",
        [reversalId]
      );

      await AuditService.log(
        {
          tableName: 'journal_entries',
          recordId: reversalId,
          action: 'reverse',
          userId: userId || null,
          afterData: { reversalOf: original.id, number: reversalNumber },
        },
        tx
      );
    });

    return { reversalEntryId: reversalId, reversalNumber };
  }

  /**
   * 6. Block edit / delete of posted entries at service layer
   */
  static async assertNotPosted(id: number): Promise<void> {
    const res = await pool.query<{ status: string }>(
      'SELECT status FROM journal_entries WHERE id = $1',
      [id]
    );
    if (!res.rows[0]) {
      const err = new Error(`Journal entry ${id} not found`);
      (err as any).statusCode = 404;
      throw err;
    }
    if (res.rows[0].status === 'posted') {
      const err = new Error('Posted journal entries cannot be modified or deleted. Use a reversal.');
      (err as any).code = 'IMMUTABLE_RECORD';
      (err as any).severity = 'blocking';
      (err as any).statusCode = 400;
      throw err;
    }
  }

  static async updateDraftEntry(
    id: number,
    input: CreateJournalEntryInput
  ): Promise<JournalEntryDetail> {
    await this.assertNotPosted(id);

    await withTransaction(async (tx) => {
      await tx.query(
        `UPDATE journal_entries
         SET journal_id = $1, reference = $2, entry_date = COALESCE($3, entry_date)
         WHERE id = $4 AND status = 'draft'`,
        [input.journal_id, input.reference || null, input.entry_date || null, id]
      );

      // Re-create lines
      await tx.query('DELETE FROM journal_entry_lines WHERE entry_id = $1', [id]);

      for (const line of input.lines) {
        const debitStr = new Decimal(line.debit || 0).toFixed(2);
        const creditStr = new Decimal(line.credit || 0).toFixed(2);

        await tx.query(
          `INSERT INTO journal_entry_lines
             (entry_id, account_id, partner_id, analytic_account_id, debit, credit, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            line.account_id,
            line.partner_id || null,
            line.analytic_account_id || null,
            debitStr,
            creditStr,
            line.description || null,
          ]
        );
      }
    });

    const full = await this.getEntryById(id);
    if (!full) throw new Error('Failed to retrieve updated entry');
    return full;
  }

  static async deleteDraftEntry(id: number): Promise<{ id: number; deleted: boolean }> {
    await this.assertNotPosted(id);

    await withTransaction(async (tx) => {
      await tx.query('DELETE FROM journal_entry_lines WHERE entry_id = $1', [id]);
      await tx.query("DELETE FROM journal_entries WHERE id = $1 AND status = 'draft'", [id]);
    });

    return { id, deleted: true };
  }
}
