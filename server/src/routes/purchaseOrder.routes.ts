import { Router, Request, Response } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrder.service.js';
import { CreatePOInputSchema, UpdatePOInputSchema } from '../../../shared/schemas/purchaseOrder.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const poRouter = Router();

// GET /api/purchase-orders
poRouter.get('/', (_req: Request, res: Response) => {
  try {
    const pos = PurchaseOrderService.getAll();
    return sendSuccess(res, pos);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/purchase-orders/:id
poRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const po = PurchaseOrderService.getById(id);
    if (!po) return sendError(res, 'NOT_FOUND', 'Purchase Order not found', 'blocking', 404);

    return sendSuccess(res, po);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/purchase-orders
poRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreatePOInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid purchase order data', 'blocking', 400, fieldErrors);
    }

    const po = PurchaseOrderService.create(parsed.data);
    return sendSuccess(res, po, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/purchase-orders/:id
poRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const parsed = UpdatePOInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid purchase order data', 'blocking', 400, fieldErrors);
    }

    const updated = PurchaseOrderService.update(id, parsed.data);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Purchase order not found or already confirmed', 'blocking', 400);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// POST /api/purchase-orders/:id/confirm
poRouter.post('/:id/confirm', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const result = PurchaseOrderService.confirm(id);
    if (!result) return sendError(res, 'NOT_FOUND', 'Purchase Order not found', 'blocking', 404);

    const { po, budgetCheck } = result;

    if (budgetCheck.hasWarning) {
      // Return the PO confirmed with non-blocking warning attached
      return res.status(200).json({
        data: po,
        error: {
          code: 'BUDGET_OVERRUN',
          message: budgetCheck.warningMessage || 'Approved budget exceeded',
          severity: 'warning',
        },
      });
    }

    return sendSuccess(res, po);
  } catch (err: any) {
    return sendError(res, 'CONFIRM_FAILED', err.message);
  }
});

// POST /api/purchase-orders/:id/cancel
poRouter.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const po = PurchaseOrderService.cancel(id);
    if (!po) return sendError(res, 'NOT_FOUND', 'Purchase Order not found', 'blocking', 404);

    return sendSuccess(res, po);
  } catch (err: any) {
    return sendError(res, 'CANCEL_FAILED', err.message);
  }
});

// POST /api/purchase-orders/:id/create-bill
poRouter.post('/:id/create-bill', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const bill = PurchaseOrderService.createBillFromPO(id);
    return sendSuccess(res, bill, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_BILL_FAILED', err.message);
  }
});
