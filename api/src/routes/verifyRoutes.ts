import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { ReportService } from '../services/reportService';

export const verifyRouter = Router();

/**
 * GET /api/verify
 * Returns { totalDebit, totalCredit, difference }
 * Difference must be "0.00" in a balanced ledger.
 */
verifyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await ReportService.verifyLedger();
    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('Error verifying ledger balance:', error);
    return sendError(res, 'VERIFY_ERROR', error.message || 'Failed to verify ledger', 500);
  }
});
