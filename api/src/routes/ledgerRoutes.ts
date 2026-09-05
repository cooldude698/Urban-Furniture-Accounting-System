import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { ReportService } from '../services/reportService';

export const ledgerRouter = Router();

/**
 * GET /api/ledger?accountId=&from=&to=
 * Backs the multi-level ledger drill-down: Report -> Account -> Journal Entries.
 */
ledgerRouter.get('/', async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId ? parseInt(String(req.query.accountId), 10) : undefined;
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    const entries = await ReportService.getLedgerDetail(accountId, from, to);
    return sendSuccess(res, entries);
  } catch (error: any) {
    console.error('Error fetching ledger details:', error);
    return sendError(res, 'LEDGER_ERROR', error.message || 'Failed to fetch ledger details', 500);
  }
});
