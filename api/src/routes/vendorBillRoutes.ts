import { Router, Request, Response } from 'express';
import { VendorBillService } from '../services/vendorBillService';
import { PaymentService } from '../services/paymentService';
import { sendSuccess, sendError } from '../utils/response';

export const billRouter = Router();

// GET /api/bills
billRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const bills = await VendorBillService.getAll();
    return sendSuccess(res, bills);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/bills/:id
billRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const bill = await VendorBillService.getById(id);
    if (!bill) return sendError(res, 'NOT_FOUND', 'Vendor Bill not found', 404);

    return sendSuccess(res, bill);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/bills
billRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const bill = await VendorBillService.create({
      vendorId: body.vendorId || body.vendor_id,
      billReference: body.billReference || body.bill_reference,
      poId: body.poId !== undefined ? body.poId : body.po_id,
      billDate: body.billDate || body.bill_date,
      dueDate: body.dueDate || body.due_date,
      lines: (body.lines || []).map((l: any) => ({
        productId: l.productId || l.product_id,
        accountId: l.accountId || l.account_id,
        analyticAccountId: l.analyticAccountId !== undefined ? l.analyticAccountId : l.analytic_account_id,
        qty: l.qty,
        unitPrice: l.unitPrice || l.unit_price,
        taxRate: l.taxRate !== undefined ? l.taxRate : l.tax_rate,
      })),
    });
    return sendSuccess(res, bill, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// POST /api/bills/:id/confirm
billRouter.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const result = await VendorBillService.confirm(id);
    if (result.warning) {
      return res.status(200).json({
        data: result.bill,
        error: {
          code: 'BUDGET_WARNING',
          message: result.warning,
          severity: 'warning',
        },
      });
    }

    return sendSuccess(res, result.bill);
  } catch (err: any) {
    return sendError(res, 'CONFIRM_FAILED', err.message);
  }
});

// POST /api/bills/:id/cancel
billRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const bill = await VendorBillService.cancel(id);
    return sendSuccess(res, bill);
  } catch (err: any) {
    return sendError(res, 'CANCEL_FAILED', err.message);
  }
});

// GET /api/bills/:id/payments
billRouter.get('/:id/payments', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const payments = await PaymentService.getPaymentHistoryForBill(id);
    return sendSuccess(res, payments);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/bills/:id/payments - Direct bill payment registration
billRouter.post('/:id/payments', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const bill = await VendorBillService.getById(id);
    if (!bill) return sendError(res, 'NOT_FOUND', 'Vendor Bill not found', 404);

    const { amount, method, paymentDate } = req.body;
    if (!amount || Number(amount) <= 0) {
      return sendError(res, 'VALIDATION_ERROR', 'Payment amount must be greater than zero');
    }
    if (!method || !['cash', 'bank'].includes(method)) {
      return sendError(res, 'VALIDATION_ERROR', 'Payment method must be cash or bank');
    }

    const payment = await PaymentService.createPayment(
      {
        direction: 'outbound',
        partnerId: bill.vendorId,
        method,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        amount: String(amount),
        allocations: [
          {
            billId: bill.id,
            amount: String(amount),
          },
        ],
      },
      (req as any).user?.id
    );

    return sendSuccess(res, payment, 201);
  } catch (err: any) {
    return sendError(res, 'PAYMENT_FAILED', err.message);
  }
});

