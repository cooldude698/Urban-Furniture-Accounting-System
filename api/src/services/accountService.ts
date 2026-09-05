import { pool } from '../db/pool';

export interface AccountDTO {
  id: number;
  name: string;
  type: string;
  is_archived: boolean;
  created_at: string;
}

export interface JournalDTO {
  id: number;
  name: string;
  type: string;
  default_account_id: number;
  default_account_name?: string;
  is_archived: boolean;
  created_at: string;
}

export interface AnalyticAccountDTO {
  id: number;
  name: string;
  type: 'income' | 'expense';
  is_archived: boolean;
  created_at: string;
}

export class AccountService {
  // --- Accounts ---
  static async getAllAccounts(includeArchived = false, type?: string): Promise<AccountDTO[]> {
    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];
    if (!includeArchived) {
      query += ' AND is_archived = false';
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    query += ' ORDER BY id ASC';
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getAccountById(id: number): Promise<AccountDTO | null> {
    const res = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async createAccount(input: { name: string; type: string }): Promise<AccountDTO> {
    const res = await pool.query(
      'INSERT INTO accounts (name, type) VALUES ($1, $2) RETURNING *',
      [input.name, input.type]
    );
    return res.rows[0];
  }

  static async updateAccount(id: number, input: { name?: string; type?: string }): Promise<AccountDTO | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (input.name) {
      values.push(input.name);
      fields.push(`name = $${values.length}`);
    }
    if (input.type) {
      values.push(input.type);
      fields.push(`type = $${values.length}`);
    }
    if (fields.length === 0) return this.getAccountById(id);
    values.push(id);
    const res = await pool.query(
      `UPDATE accounts SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  static async archiveAccount(id: number, isArchived = true): Promise<AccountDTO | null> {
    const res = await pool.query(
      'UPDATE accounts SET is_archived = $1 WHERE id = $2 RETURNING *',
      [isArchived, id]
    );
    return res.rows[0] || null;
  }

  // --- Journals ---
  static async getAllJournals(includeArchived = false, type?: string): Promise<JournalDTO[]> {
    let query = `
      SELECT j.*, a.name AS default_account_name 
      FROM journals j 
      LEFT JOIN accounts a ON j.default_account_id = a.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    if (!includeArchived) {
      query += ' AND j.is_archived = false';
    }
    if (type) {
      params.push(type);
      query += ` AND j.type = $${params.length}`;
    }
    query += ' ORDER BY j.id ASC';
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getJournalById(id: number): Promise<JournalDTO | null> {
    const res = await pool.query(
      `SELECT j.*, a.name AS default_account_name 
       FROM journals j 
       LEFT JOIN accounts a ON j.default_account_id = a.id 
       WHERE j.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createJournal(input: { name: string; type: string; default_account_id: number }): Promise<JournalDTO> {
    const res = await pool.query(
      'INSERT INTO journals (name, type, default_account_id) VALUES ($1, $2, $3) RETURNING *',
      [input.name, input.type, input.default_account_id]
    );
    return this.getJournalById(res.rows[0].id) as Promise<JournalDTO>;
  }

  static async updateJournal(id: number, input: { name?: string; type?: string; default_account_id?: number }): Promise<JournalDTO | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (input.name) {
      values.push(input.name);
      fields.push(`name = $${values.length}`);
    }
    if (input.type) {
      values.push(input.type);
      fields.push(`type = $${values.length}`);
    }
    if (input.default_account_id) {
      values.push(input.default_account_id);
      fields.push(`default_account_id = $${values.length}`);
    }
    if (fields.length === 0) return this.getJournalById(id);
    values.push(id);
    const res = await pool.query(
      `UPDATE journals SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!res.rows[0]) return null;
    return this.getJournalById(id);
  }

  static async archiveJournal(id: number, isArchived = true): Promise<JournalDTO | null> {
    const res = await pool.query(
      'UPDATE journals SET is_archived = $1 WHERE id = $2 RETURNING *',
      [isArchived, id]
    );
    return res.rows[0] || null;
  }

  // --- Analytic Accounts ---
  static async getAllAnalytics(includeArchived = false, type?: string): Promise<AnalyticAccountDTO[]> {
    let query = 'SELECT * FROM analytic_accounts WHERE 1=1';
    const params: any[] = [];
    if (!includeArchived) {
      query += ' AND is_archived = false';
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    query += ' ORDER BY id ASC';
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getAnalyticById(id: number): Promise<AnalyticAccountDTO | null> {
    const res = await pool.query('SELECT * FROM analytic_accounts WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async createAnalytic(input: { name: string; type: 'income' | 'expense' }): Promise<AnalyticAccountDTO> {
    const res = await pool.query(
      'INSERT INTO analytic_accounts (name, type) VALUES ($1, $2) RETURNING *',
      [input.name, input.type]
    );
    return res.rows[0];
  }

  static async updateAnalytic(id: number, input: { name?: string; type?: 'income' | 'expense' }): Promise<AnalyticAccountDTO | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (input.name) {
      values.push(input.name);
      fields.push(`name = $${values.length}`);
    }
    if (input.type) {
      values.push(input.type);
      fields.push(`type = $${values.length}`);
    }
    if (fields.length === 0) return this.getAnalyticById(id);
    values.push(id);
    const res = await pool.query(
      `UPDATE analytic_accounts SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  static async archiveAnalytic(id: number, isArchived = true): Promise<AnalyticAccountDTO | null> {
    const res = await pool.query(
      'UPDATE analytic_accounts SET is_archived = $1 WHERE id = $2 RETURNING *',
      [isArchived, id]
    );
    return res.rows[0] || null;
  }
}
