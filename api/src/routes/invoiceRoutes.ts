import { Router, Request, Response } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';
import Decimal from 'decimal.js';

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

// 2b. GET /api/invoices/open - List open confirmed customer invoices
invoiceRouter.get('/open', async (req: Request, res: Response) => {
  try {
    const partnerId = req.query.partner_id || req.query.customerId;
    const customerId = partnerId ? parseInt(String(partnerId), 10) : undefined;
    const invoices = await InvoiceService.listInvoices({ status: 'confirmed', customerId });
    const openInvoices = invoices.filter(inv => new Decimal(inv.amountDue || '0').greaterThan(0));
    return sendSuccess(res, openInvoices);
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

// 5b. POST /api/invoices/:id/payments - Direct invoice payment registration
invoiceRouter.post('/:id/payments', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await InvoiceService.getInvoiceById(invId);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Customer invoice #${invId} not found`, 404);
    }

    const { amount, method, paymentDate } = req.body;
    if (!amount || Number(amount) <= 0) {
      return sendError(res, 'VALIDATION_ERROR', 'Payment amount must be greater than zero');
    }
    if (!method || !['cash', 'bank'].includes(method)) {
      return sendError(res, 'VALIDATION_ERROR', 'Payment method must be cash or bank');
    }

    const { PaymentService } = await import('../services/paymentService');
    const payment = await PaymentService.createPayment(
      {
        direction: 'inbound',
        partnerId: invoice.customerId,
        method,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        amount: String(amount),
        allocations: [
          {
            invoiceId: invoice.id,
            amount: String(amount),
          },
        ],
      },
      (req as any).user?.id
    );

    return sendSuccess(res, payment, 201);
  } catch (err: any) {
    return sendError(res, 'PAYMENT_FAILED', err.message, 400);
  }
});

// 5c. POST /api/invoices/:id/razorpay/create-order - Create Razorpay order for this invoice
invoiceRouter.post('/:id/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await InvoiceService.getInvoiceById(invId);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Customer invoice #${invId} not found`, 404);
    }

    const amount = req.body.amount || invoice.amountDue;
    const { RazorpayService } = await import('../services/razorpayService');
    const order = await RazorpayService.createOrder(amount, `inv_${invoice.id}_${Date.now()}`, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customerId,
    });

    return sendSuccess(res, order);
  } catch (err: any) {
    return sendError(res, 'RAZORPAY_ERROR', err.message, 400);
  }
});

// 5d. POST /api/invoices/:id/razorpay/verify-payment - Verify signature and record ledger payment
invoiceRouter.post('/:id/razorpay/verify-payment', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await InvoiceService.getInvoiceById(invId);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Customer invoice #${invId} not found`, 404);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const { RazorpayService } = await import('../services/razorpayService');
    const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return sendError(res, 'INVALID_SIGNATURE', 'Razorpay payment signature verification failed', 400);
    }

    const paymentAmount = String(amount || invoice.amountDue);
    const { PaymentService } = await import('../services/paymentService');
    const payment = await PaymentService.createPayment(
      {
        direction: 'inbound',
        partnerId: invoice.customerId,
        method: 'bank',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: paymentAmount,
        allocations: [
          {
            invoiceId: invoice.id,
            amount: paymentAmount,
          },
        ],
      },
      (req as any).user?.id
    );

    // Refresh invoice and dispatch official payment receipt with PDF attachment via Resend
    let emailResult = null;
    try {
      const updatedInvoice = await InvoiceService.getInvoiceById(invId);
      const { EmailService } = await import('../services/emailService');
      emailResult = await EmailService.sendPaymentReceiptEmail({
        invoice: updatedInvoice || invoice,
        paymentAmount,
        paymentMethod: 'Razorpay Online Gateway',
        paymentRef: razorpay_payment_id,
        recipientEmail: req.body.recipientEmail || req.body.email,
      });
    } catch (eErr: any) {
      console.warn('[InvoiceRoutes] Resend email dispatch notice:', eErr.message);
    }

    return sendSuccess(res, {
      success: true,
      payment,
      razorpayPaymentId: razorpay_payment_id,
      email: emailResult,
    });
  } catch (err: any) {
    return sendError(res, 'PAYMENT_FAILED', err.message, 400);
  }
});

// 5e. POST /api/invoices/:id/send-receipt - On-demand send payment receipt PDF via Resend
invoiceRouter.post('/:id/send-receipt', async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await InvoiceService.getInvoiceById(invId);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Customer invoice #${invId} not found`, 404);
    }

    const recipientEmail = req.body.email || req.body.recipientEmail;
    const { EmailService } = await import('../services/emailService');
    const result = await EmailService.sendPaymentReceiptEmail({
      invoice,
      paymentAmount: String(req.body.amount || invoice.amountPaid || invoice.total),
      paymentMethod: req.body.method || 'Bank / Online Receipt',
      paymentRef: req.body.paymentRef || invoice.number,
      recipientEmail,
    });

    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, 'EMAIL_FAILED', err.message, 500);
  }
});

// 6. GET & POST /api/invoices/:id/pdf - Export PDF (server-side Puppeteer)
const handleInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await InvoiceService.getInvoiceById(invId);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Customer invoice #${invId} not found`, 404);
    }

    const { PdfService } = await import('../services/pdfService');

    // Option to view rendered HTML directly
    if (req.query.format === 'html') {
      const html = PdfService.generateInvoiceHtml(invoice);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    try {
      const pdfBuffer = await PdfService.generateInvoicePdf(invoice);
      const filename = `Invoice-${invoice.number.replace(/\//g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (pdfErr: any) {
      console.warn('Puppeteer launch fallback to printable HTML:', pdfErr.message);
      const html = PdfService.generateInvoiceHtml(invoice);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
};

invoiceRouter.get('/:id/pdf', handleInvoicePdf);
invoiceRouter.post('/:id/pdf', handleInvoicePdf);

