import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import {
  getProductPerformance,
  getRevenueTrend,
  getExpenseBreakdown,
  getReorderSuggestions,
} from '../services/analyticsService';

export const analyticsRouter = Router();

/**
 * GET /api/analytics/products
 * Product performance: units sold, revenue, COGS, gross profit, margin%.
 * Query params: from=YYYY-MM-DD, to=YYYY-MM-DD
 */
analyticsRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const rows = await getProductPerformance({ from, to });
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /products error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute product analytics');
  }
});

/**
 * GET /api/analytics/revenue-trend
 * Month-by-month revenue, COGS, gross profit.
 * Query params: months=6 (default 6, max 24)
 */
analyticsRouter.get('/revenue-trend', async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(String(req.query.months), 10) : 6;
    const rows = await getRevenueTrend({ months: isNaN(months) ? 6 : months });
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /revenue-trend error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute revenue trend');
  }
});

/**
 * GET /api/analytics/expenses
 * Expense breakdown by account from posted journal entry lines.
 * Query params: from=YYYY-MM-DD, to=YYYY-MM-DD
 */
analyticsRouter.get('/expenses', async (req: Request, res: Response) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const rows = await getExpenseBreakdown({ from, to });
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /expenses error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute expense breakdown');
  }
});

/**
 * GET /api/analytics/reorder
 * Reorder suggestions: rule-based formula over stock_moves + invoices.
 * No date params — always looks at current stock vs recent velocity.
 */
analyticsRouter.get('/reorder', async (req: Request, res: Response) => {
  try {
    const rows = await getReorderSuggestions();
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /reorder error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute reorder suggestions');
  }
});
