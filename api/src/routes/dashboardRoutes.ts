import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { sendSuccess, sendError } from '../utils/response';

export const dashboardRouter = Router();

/**
 * GET /api/dashboard/stats
 * Counts for Sales, Purchase, Budget cards
 */
dashboardRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await DashboardService.getStats();
    return sendSuccess(res, stats);
  } catch (err: any) {
    console.error('Error in /api/dashboard/stats:', err);
    return sendError(res, 'STATS_FAILED', err.message || 'Failed to fetch dashboard stats', 500);
  }
});

/**
 * GET /api/dashboard/kpi
 * Real-time financial balances: Cash, Bank, Receivable, Payable, Net Income
 */
dashboardRouter.get('/kpi', async (_req: Request, res: Response) => {
  try {
    const kpi = await DashboardService.getKPI();
    return sendSuccess(res, kpi);
  } catch (err: any) {
    console.error('Error in /api/dashboard/kpi:', err);
    return sendError(res, 'KPI_FAILED', err.message || 'Failed to fetch KPI data', 500);
  }
});

/**
 * GET /api/dashboard/activity
 * Recent transactional documents across Sales, Purchase, and Invoices
 */
dashboardRouter.get('/activity', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const activity = await DashboardService.getRecentActivity(limit);
    return sendSuccess(res, activity);
  } catch (err: any) {
    console.error('Error in /api/dashboard/activity:', err);
    return sendError(res, 'ACTIVITY_FAILED', err.message || 'Failed to fetch recent activity', 500);
  }
});

/**
 * GET /api/dashboard/trends
 * Revenue vs Expenses monthly trend
 */
dashboardRouter.get('/trends', async (_req: Request, res: Response) => {
  try {
    const trends = await DashboardService.getTrends();
    return sendSuccess(res, trends);
  } catch (err: any) {
    console.error('Error in /api/dashboard/trends:', err);
    return sendError(res, 'TRENDS_FAILED', err.message || 'Failed to fetch trends data', 500);
  }
});

/**
 * GET /api/dashboard/alerts
 * Operational alerts (overdue invoices, low stock)
 */
dashboardRouter.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await DashboardService.getAlerts();
    return sendSuccess(res, alerts);
  } catch (err: any) {
    console.error('Error in /api/dashboard/alerts:', err);
    return sendError(res, 'ALERTS_FAILED', err.message || 'Failed to fetch alerts', 500);
  }
});
