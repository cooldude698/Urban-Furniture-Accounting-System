import { Router, Request, Response } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

export const invoiceRouter = Router();

const InvoiceLineSchema = z.object({
  productId: z.number().int().positive('Product is required'),
  accountId: z.number().int().positive().optional(),
  analyticAccountId: z.number().int().positive().nullable().optional(),
  qty: z.string().or(z.number()),
  unitPrice: z.string().or(z.number()),
  taxRate: z.string().or(z.number()).optional(),
});

const CreateInvoiceSchema = z.object({
  soId: z.number().int().positive().nullable().optional(),
  customerId: z.number().int().positive('Customer is required'),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1, 'At least one line item is required'),
});

// 1. POST /api/invoices - Create draft Customer Invoice
routerPost: invoiceRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parse = CreateInvoiceSchema.safeParse(req.body);
    if (!parse.success) {
      const fields: Record<string, string> = {};
      parse.error.issues.forEach(err => {
        fields[err.path.join('.')] = err.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid invoice data', 400, 'blocking', fields);
    }

    const invoice = await InvoiceService.createInvoice(parse.data, (req as any).user?.id);
    return sendSuccess(res, invoice, 201);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message || 'Failed to create customer invoice', 500);
  }
});

// 2. GET /api/invoices - List customer invoices
invoiceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId ? parseInt(String(req.query.customerId), 10) : undefined;
    const invoices = await InvoiceService.listInvoices({ status, customerId });
    return sendSuccess(res, invoices);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 3. GET /api/invoices/:id - Get invoice detail with computed payment status from v_invoice_status
invoiceRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await InvoiceService.getInvoiceById(invId);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Customer invoice #${invId} not found`, 404);
    }

    return sendSuccess(res, invoice);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 4. POST /api/invoices/:id/confirm - Confirm invoice
invoiceRouter.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const confirmed = await InvoiceService.confirmInvoice(invId, (req as any).user?.id);
    return sendSuccess(res, confirmed);
  } catch (err: any) {
    return sendError(res, 'CONFIRM_ERROR', err.message, 400);
  }
});

// 5. GET /api/invoices/:id/payments - Payment history panel
invoiceRouter.get('/:id/payments', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const history = await InvoiceService.getInvoicePayments(invId);
    return sendSuccess(res, history);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

