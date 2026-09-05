import { Router, Request, Response } from 'express';
import { IntegrityService } from '../services/integrityService';
import { sendSuccess, sendError } from '../utils/response';

export const integrityRouter = Router();

/**
 * GET /api/integrity
 * Runs all ten system-integrity checks against live data. Admin only
 * (enforced by requireAuth + requireRole('admin') at mount time).
 */
integrityRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const report = await IntegrityService.runAll();
    return sendSuccess(res, report);
  } catch (err: any) {
    console.error('Error in /api/integrity:', err);
    return sendError(res, 'INTEGRITY_FAILED', err.message || 'Failed to run integrity checks', 500);
  }
});
