import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { createPaymentSchema } from '../shared/schemas/payment';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { sendSuccess, sendError } from '../utils/response';

export const paymentRouter = Router();

paymentRouter.use(requireAuth);

// 1. POST /api/payments (supports both /payments and root / when mounted at /api/payments)
const handleCreatePayment = async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = createPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    const fields: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = issue.path.join('.') || 'root';
      fields[key] = issue.message;
    }
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, 'blocking', fields);
  }

  try {
    const result = await PaymentService.createPayment(parseResult.data);
    return sendSuccess(res, result, 201);
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    const severity = err.severity || 'blocking';
    const code = err.code || 'PAYMENT_FAILED';
    return sendError(res, code, err.message || 'Failed to create payment', statusCode, severity);
  }
};

paymentRouter.post('/payments', requireRole('admin', 'accountant', 'manager'), handleCreatePayment);
paymentRouter.post('/', requireRole('admin', 'accountant', 'manager'), handleCreatePayment);

// 2. GET /api/invoices/:id/payments — full history: date, method, amount
paymentRouter.get('/invoices/:id/payments', async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id as string, 10);
  if (isNaN(invoiceId)) {
    return sendError(res, 'INVALID_ID', 'Invalid invoice ID', 400);
  }

  try {
    const history = await PaymentService.getInvoicePayments(invoiceId);
    return sendSuccess(res, history);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message || 'Failed to fetch invoice payment history', 500);
  }
});

// 3. GET /api/receivables — customer-wise: total invoiced, total paid, outstanding
paymentRouter.get('/receivables', requireRole('admin', 'accountant', 'manager'), async (req: Request, res: Response) => {
  try {
    const receivables = await PaymentService.getReceivablesSummary();
    return sendSuccess(res, receivables);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message || 'Failed to fetch receivables summary', 500);
  }
});

// 4. GET /api/aging?type=receivable|payable — buckets 0-30, 31-60, 61-90, 90+
paymentRouter.get('/aging', requireRole('admin', 'accountant', 'manager'), async (req: Request, res: Response) => {
  const type = req.query.type as string;
  if (type !== 'receivable' && type !== 'payable') {
    return sendError(res, 'INVALID_QUERY', 'Query param "type" must be "receivable" or "payable"', 400);
  }

  try {
    const aging = await PaymentService.getAgingReport(type);
    return sendSuccess(res, aging);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message || 'Failed to fetch aging report', 500);
  }
});
