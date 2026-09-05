import { Router, Request, Response } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrderService';
import { sendSuccess, sendError } from '../utils/response';

export const poRouter = Router();

// GET /api/purchase-orders
poRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const pos = await PurchaseOrderService.getAll();
    return sendSuccess(res, pos);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/purchase-orders/:id
poRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const po = await PurchaseOrderService.getById(id);
    if (!po) return sendError(res, 'NOT_FOUND', 'Purchase Order not found', 404);

    return sendSuccess(res, po);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/purchase-orders
poRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Map camelCase or snake_case
    const po = await PurchaseOrderService.create({
      vendorId: body.vendorId || body.vendor_id,
      poDate: body.poDate || body.po_date,
      lines: (body.lines || []).map((l: any) => ({
        productId: l.productId || l.product_id,
        analyticAccountId: l.analyticAccountId !== undefined ? l.analyticAccountId : l.analytic_account_id,
        qty: l.qty,
        unitPrice: l.unitPrice || l.unit_price,
        taxRate: l.taxRate || l.tax_rate,
      })),
    });
    return sendSuccess(res, po, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// POST /api/purchase-orders/:id/confirm
poRouter.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const result = await PurchaseOrderService.confirm(id);
    if (result.warning) {
      return res.status(200).json({
        data: result.po,
        error: {
          code: 'BUDGET_WARNING',
          message: result.warning,
          severity: 'warning',
        },
      });
    }

    return sendSuccess(res, result.po);
  } catch (err: any) {
    return sendError(res, 'CONFIRM_FAILED', err.message);
  }
});

// POST /api/purchase-orders/:id/cancel
poRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const po = await PurchaseOrderService.cancel(id);
    return sendSuccess(res, po);
  } catch (err: any) {
    return sendError(res, 'CANCEL_FAILED', err.message);
  }
});

// POST /api/purchase-orders/:id/create-bill
poRouter.post('/:id/create-bill', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const result = await PurchaseOrderService.createBillFromPO(id);
    return sendSuccess(res, result, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_BILL_FAILED', err.message);
  }
});
