import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import {
  getProductProfitability,
  getProductInvoices,
  getInventoryAnalytics,
  getCustomerAnalytics,
  getCustomerInvoices,
  getReorderSuggestions,
  createPurchaseOrderFromReorder,
  getRevenueTrend,
  getExpenseBreakdown,
} from '../services/analyticsService';

export const analyticsRouter = Router();

/**
 * PHASE 1: Product Profitability
 * GET /api/analytics/products?from=&to=
 */
analyticsRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const rows = await getProductProfitability({ from, to });
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /products error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute product profitability');
  }
});

/**
 * PHASE 1 DRILLDOWN: Invoices for a specific product
 * GET /api/analytics/products/:id/invoices?from=&to=
 */
analyticsRouter.get('/products/:id/invoices', async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const productId = parseInt(idParam, 10);
    if (isNaN(productId)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid product ID');
    }
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const rows = await getProductInvoices(productId, { from, to });
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /products/:id/invoices error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to fetch product invoices');
  }
});

/**
 * PHASE 2: ABC, Velocity, Dead Stock, GMROI, Linear Trend
 * GET /api/analytics/inventory?from=&to=
 */
analyticsRouter.get('/inventory', async (req: Request, res: Response) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const data = await getInventoryAnalytics({ from, to });
    return sendSuccess(res, data);
  } catch (err: any) {
    console.error('[analytics] /inventory error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute inventory analytics');
  }
});

/**
 * PHASE 3: Customer & Receivables Intelligence
 * GET /api/analytics/customers?from=&to=
 */
analyticsRouter.get('/customers', async (req: Request, res: Response) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const data = await getCustomerAnalytics({ from, to });
    return sendSuccess(res, data);
  } catch (err: any) {
    console.error('[analytics] /customers error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to compute customer analytics');
  }
});

/**
 * PHASE 3 DRILLDOWN: Invoices for a specific customer
 * GET /api/analytics/customers/:id/invoices
 */
analyticsRouter.get('/customers/:id/invoices', async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const customerId = parseInt(idParam, 10);
    if (isNaN(customerId)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid customer ID');
    }
    const rows = await getCustomerInvoices(customerId);
    return sendSuccess(res, rows);
  } catch (err: any) {
    console.error('[analytics] /customers/:id/invoices error:', err);
    return sendError(res, 'ANALYTICS_ERROR', err.message || 'Failed to fetch customer invoices');
  }
});

/**
 * PHASE 4: Reorder Suggestions
 * GET /api/analytics/reorder
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

/**
 * PHASE 4: Create Purchase Order from Reorder Suggestion
 * POST /api/analytics/reorder/create-po
 * Body: { productId: number, qty?: number }
 */
analyticsRouter.post('/reorder/create-po', async (req: Request, res: Response) => {
  try {
    const { productId, qty } = req.body;
    if (!productId) {
      return sendError(res, 'VALIDATION_ERROR', 'Product ID is required');
    }
    const result = await createPurchaseOrderFromReorder({
      productId: Number(productId),
      qty: qty ? Number(qty) : undefined,
    });
    return sendSuccess(res, result, 201);
  } catch (err: any) {
    console.error('[analytics] /reorder/create-po error:', err);
    return sendError(res, 'PO_CREATION_FAILED', err.message || 'Failed to create purchase order');
  }
});

/**
 * Legacy routes preserved for compatibility
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
