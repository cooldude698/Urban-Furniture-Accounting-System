import { Router, Request, Response } from 'express';
import { VendorBillService } from '../services/vendorBill.service.js';
import { CreateBillInputSchema, UpdateBillInputSchema } from '../../../shared/schemas/vendorBill.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const billRouter = Router();

// GET /api/bills
billRouter.get('/', (_req: Request, res: Response) => {
  try {
    const bills = VendorBillService.getAll();
    return sendSuccess(res, bills);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/bills/:id
billRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const bill = VendorBillService.getById(id);
    if (!bill) return sendError(res, 'NOT_FOUND', 'Vendor Bill not found', 'blocking', 404);

    return sendSuccess(res, bill);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/bills
billRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreateBillInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid vendor bill data', 'blocking', 400, fieldErrors);
    }

    const bill = VendorBillService.create(parsed.data);
    return sendSuccess(res, bill, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// POST /api/bills/:id/confirm
billRouter.post('/:id/confirm', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const result = VendorBillService.confirm(id);
    if (!result) return sendError(res, 'NOT_FOUND', 'Vendor Bill not found or already confirmed', 'blocking', 400);

    const { bill, budgetCheck } = result;

    if (budgetCheck.hasWarning) {
      return res.status(200).json({
        data: bill,
        error: {
          code: 'BUDGET_OVERRUN',
          message: budgetCheck.warningMessage || 'Approved budget exceeded',
          severity: 'warning',
        },
      });
    }

    return sendSuccess(res, bill);
  } catch (err: any) {
    return sendError(res, 'CONFIRM_FAILED', err.message);
  }
});

// POST /api/bills/:id/cancel
billRouter.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const bill = VendorBillService.cancel(id);
    if (!bill) return sendError(res, 'NOT_FOUND', 'Vendor Bill not found', 'blocking', 404);

    return sendSuccess(res, bill);
  } catch (err: any) {
    return sendError(res, 'CANCEL_FAILED', err.message);
  }
});
