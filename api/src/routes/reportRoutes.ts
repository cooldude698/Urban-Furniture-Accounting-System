import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/response';
import { UserPayload } from '../services/scope';
import { ReportService } from '../services/reportService';

export const reportRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware to block contact users from all financial reports
reportRouter.use((req: Request, res: Response, next) => {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      if (decoded.role === 'contact') {
        return sendError(
          res,
          'FORBIDDEN',
          'Access denied: Customer portal contacts cannot access financial reports',
          403
        );
      }
    } catch {
      // Invalid token
    }
  }
  next();
});

/**
 * GET /api/reports/profit-loss?from=&to=
 * Filtered BETWEEN two dates. Reads ONLY from posted journal entry lines.
 */
reportRouter.get('/profit-loss', async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    const report = await ReportService.getProfitAndLoss(from, to);
    return sendSuccess(res, report);
  } catch (error: any) {
    console.error('Error generating Profit & Loss report:', error);
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to generate Profit & Loss report', 500);
  }
});

/**
 * GET /api/reports/balance-sheet?asOf=
 * Cumulative UP TO one date. Incorporates current-period net profit into equity.
 */
reportRouter.get('/balance-sheet', async (req: Request, res: Response) => {
  try {
    const asOf = req.query.asOf ? String(req.query.asOf) : undefined;

    const report = await ReportService.getBalanceSheet(asOf);
    return sendSuccess(res, report);
  } catch (error: any) {
    console.error('Error generating Balance Sheet report:', error);
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to generate Balance Sheet report', 500);
  }
});

/**
 * GET /api/reports/budget?budgetId=
 * Reads from v_budget_line_progress.
 */
reportRouter.get('/budget', async (req: Request, res: Response) => {
  try {
    const budgetId = req.query.budgetId ? parseInt(String(req.query.budgetId), 10) : undefined;
    const budget = await ReportService.getBudgetProgress(budgetId);
    return sendSuccess(res, budget);
  } catch (error: any) {
    console.error('Error fetching budget report:', error);
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to fetch budget report', 500);
  }
});

/**
 * GET /api/reports/budget/:lineId/documents
 * Backs the clickable Achieved Amount drill-down for a budget line.
 */
reportRouter.get('/budget/:lineId/documents', async (req: Request, res: Response) => {
  try {
    const lineId = parseInt(String(req.params.lineId), 10);
    if (isNaN(lineId)) {
      return sendError(res, 'INVALID_PARAMS', 'Invalid budget line ID', 400);
    }

    const result = await ReportService.getBudgetLineDocuments(lineId);
    if (!result) {
      return sendError(res, 'NOT_FOUND', 'Budget line not found', 404);
    }

    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('Error fetching budget documents:', error);
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to fetch budget documents', 500);
  }
});
