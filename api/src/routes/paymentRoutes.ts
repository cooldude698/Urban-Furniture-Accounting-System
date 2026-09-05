import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/paymentService';
import { sendSuccess, sendError } from '../utils/response';

export const paymentRouter = Router();

const AllocationSchema = z.object({
  invoiceId: z.number().int().positive().optional(),
  billId: z.number().int().positive().optional(),
  amount: z.string().or(z.number()),
});

const CreatePaymentSchema = z.object({
  direction: z.enum(['inbound', 'outbound']).optional().default('inbound'),
  partnerId: z.number().int().positive('Customer/Partner is required'),
  method: z.enum(['cash', 'bank']),
  paymentDate: z.string().optional(),
  amount: z.string().or(z.number()),
  allocations: z.array(AllocationSchema).min(1, 'At least one allocation is required'),
});

// 1. POST /api/payments - Register and post a payment
paymentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parse = CreatePaymentSchema.safeParse(req.body);
    if (!parse.success) {
      const fields: Record<string, string> = {};
      parse.error.issues.forEach(err => {
        fields[err.path.join('.')] = err.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid payment payload', 400, 'blocking', fields);
    }

    const payment = await PaymentService.createPayment(parse.data, (req as any).user?.id);
    return sendSuccess(res, payment, 201);
  } catch (err: any) {
    return sendError(res, 'PAYMENT_ERROR', err.message || 'Failed to process payment', 400);
  }
});

// 2. GET /api/payments/open-invoices/:customerId - List unpaid/partial invoices for customer allocation
paymentRouter.get('/open-invoices/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(String(req.params.customerId), 10);
    if (isNaN(customerId)) {
      return sendError(res, 'INVALID_ID', 'Customer ID must be a number', 400);
    }

    const invoices = await PaymentService.getOpenInvoicesForCustomer(customerId);
    return sendSuccess(res, invoices);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});
