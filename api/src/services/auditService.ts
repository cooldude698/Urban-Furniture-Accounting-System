import { pool } from '../db/pool';
import { PoolClient } from 'pg';

export interface AuditLogEntry {
  tableName: string;
  recordId: number;
  action: 'create' | 'update' | 'confirm' | 'post' | 'reverse' | 'cancel' | 'pay' | 'archive';
  userId?: number | null;
  beforeData?: any;
  afterData?: any;
}

export class AuditService {
  /**
   * Writes an entry to audit_log table.
   * Can be executed inside a client transaction or using the pool.
   */
  static async log(entry: AuditLogEntry, client?: PoolClient): Promise<number> {
    const query = `
      INSERT INTO audit_log (table_name, record_id, action, user_id, before_data, after_data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const params = [
      entry.tableName,
      entry.recordId,
      entry.action,
      entry.userId || null,
      entry.beforeData ? JSON.stringify(entry.beforeData) : null,
      entry.afterData ? JSON.stringify(entry.afterData) : null,
    ];

    const executor = client || pool;
    const res = await executor.query(query, params);
    return res.rows[0].id;
  }

  /**
   * Retrieves audit trail for a specific table or record.
   */
  static async getAuditLogs(tableName?: string, recordId?: number, limit = 100, offset = 0) {
    const query = `
      SELECT 
        al.id,
        al.table_name,
        al.record_id,
        al.action,
        al.user_id,
        u.login_id AS user_login,
        u.full_name AS user_name,
        al.before_data,
        al.after_data,
        al.created_at
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE ($1::text IS NULL OR al.table_name = $1::text)
        AND ($2::int IS NULL OR al.record_id = $2::int)
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT $3 OFFSET $4;
    `;
    const res = await pool.query(query, [tableName || null, recordId || null, limit, offset]);
    return res.rows;
  }
}
