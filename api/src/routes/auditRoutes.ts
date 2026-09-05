import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuditService } from '../services/auditService';

export const auditRouter = Router();

/**
 * GET /api/audit?table=&recordId=&limit=&offset=
 * Returns immutable audit trail of state changes.
 */
auditRouter.get('/', async (req: Request, res: Response) => {
  try {
    const table = req.query.table ? String(req.query.table) : undefined;
    const recordId = req.query.recordId ? parseInt(String(req.query.recordId), 10) : undefined;
    const limit = req.query.limit ? Math.min(parseInt(String(req.query.limit), 10), 500) : 100;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

    const logs = await AuditService.getAuditLogs(table, recordId, limit, offset);
    return sendSuccess(res, logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return sendError(res, 'AUDIT_ERROR', error.message || 'Failed to fetch audit logs', 500);
  }
});
