import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PortalService } from '../services/portalService';
import { requireAuth, requireInternalUser, requirePortalContact, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export const portalRouter = Router();

const isSecure = process.env.COOKIE_SECURE === 'true';

const InviteContactSchema = z.object({
  contactId: z.number().int().positive('Contact is required'),
  email: z.string().email('Valid email is required'),
  fullName: z.string().min(2, 'Full name is required'),
  loginId: z.string().min(6).max(12, 'Login ID must be between 6 and 12 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
});

const AcceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const PortalLoginSchema = z.object({
  login_id: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

const RecordPaymentSchema = z.object({
  method: z.enum(['cash', 'bank']),
  amount: z.string().or(z.number()),
});

// 1. POST /api/portal/invite - Accountant/admin invites a customer contact
portalRouter.post('/invite', requireAuth, requireInternalUser, async (req: Request, res: Response) => {
  try {
    const parse = InviteContactSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, 'VALIDATION_ERROR', parse.error.issues[0].message, 400);
    }

    const invite = await PortalService.inviteContact(parse.data);
    return sendSuccess(res, invite, 201);
  } catch (err: any) {
    return sendError(res, 'INVITE_ERROR', err.message || 'Failed to generate contact invite', 400);
  }
});

// 2. POST /api/portal/accept-invite - Contact sets password from invite token
portalRouter.post('/accept-invite', async (req: Request, res: Response) => {
  try {
    const parse = AcceptInviteSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, 'VALIDATION_ERROR', parse.error.issues[0].message, 400);
    }

    const result = await PortalService.acceptInvite(parse.data.token, parse.data.password);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, 'ACCEPT_ERROR', err.message || 'Failed to accept invite', 400);
  }
});

// 3. POST /api/portal/login - Contact login, returns JWT in httpOnly cookie
portalRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parse = PortalLoginSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid Login Id or Password', 401);
    }

    const result = await PortalService.portalLogin(parse.data.login_id, parse.data.password);

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { user: result.user });
  } catch (err: any) {
    const status = err.message.includes('restricted') ? 403 : 401;
    return sendError(res, 'AUTH_ERROR', err.message || 'Invalid Login Id or Password', status);
  }
});

// 4. GET /api/portal/me - Current contact user
portalRouter.get('/me', requireAuth, requirePortalContact, (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { user: req.user });
});

// 5. GET /api/portal/invoices - Contact's OWN invoices only (scoped at data layer)
portalRouter.get('/invoices', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = await PortalService.getPortalInvoices(req.user!);
    return sendSuccess(res, invoices);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 6. GET /api/portal/invoices/:id - Specific invoice with lines & payment history (scoped at data layer)
portalRouter.get('/invoices/:id', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await PortalService.getPortalInvoiceById(invId, req.user!);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', `Invoice #${invId} not found or unauthorized`, 404);
    }

    return sendSuccess(res, invoice);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 6b. GET /api/portal/invoices/:id/pdf - Scoped invoice PDF export (server-side Puppeteer with HTML fallback)
portalRouter.get('/invoices/:id/pdf', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    // Scoped check at data layer: throws / returns null if not contact's invoice
    const scopedInvoice = await PortalService.getPortalInvoiceById(invId, req.user!);
    if (!scopedInvoice) {
      return sendError(res, 'NOT_FOUND', `Invoice #${invId} not found or unauthorized`, 404);
    }

    const { InvoiceService } = await import('../services/invoiceService');
    const fullInvoice = await InvoiceService.getInvoiceById(invId);
    if (!fullInvoice) {
      return sendError(res, 'NOT_FOUND', `Invoice #${invId} not found`, 404);
    }

    const { PdfService } = await import('../services/pdfService');
    if (req.query.format === 'html') {
      const html = PdfService.generateInvoiceHtml(fullInvoice);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    try {
      const pdfBuffer = await PdfService.generateInvoicePdf(fullInvoice);
      const filename = `Invoice-${fullInvoice.number.replace(/\//g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (pdfErr: any) {
      console.warn('Puppeteer launch fallback to printable HTML:', pdfErr.message);
      const html = PdfService.generateInvoiceHtml(fullInvoice);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 7. POST /api/portal/invoices/:id/payments & /pay - Record manual payment (Cash / Bank)
portalRouter.post(['/invoices/:id/payments', '/invoices/:id/pay'], requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const parse = RecordPaymentSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, 'VALIDATION_ERROR', 'Method (cash|bank) and positive amount required', 400);
    }

    const payment = await PortalService.recordPortalPayment(
      invId,
      req.user!,
      parse.data.method,
      parse.data.amount
    );

    return sendSuccess(res, payment, 201);
  } catch (err: any) {
    return sendError(res, 'PAYMENT_ERROR', err.message || 'Failed to record payment', 400);
  }
});

// 7b. POST /api/portal/invoices/:id/razorpay/create-order - Create Razorpay order for portal customer
portalRouter.post('/invoices/:id/razorpay/create-order', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await PortalService.getPortalInvoiceById(invId, req.user!);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', 'Invoice not found or unauthorized', 404);
    }

    const amount = req.body.amount || invoice.amountDue;
    const { RazorpayService } = await import('../services/razorpayService');
    const order = await RazorpayService.createOrder(amount, `port_inv_${invoice.id}_${Date.now()}`, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: req.user!.contact_id,
    });

    return sendSuccess(res, order);
  } catch (err: any) {
    return sendError(res, 'RAZORPAY_ERROR', err.message, 400);
  }
});

// 7c. POST /api/portal/invoices/:id/razorpay/verify-payment - Verify signature & record customer payment
portalRouter.post('/invoices/:id/razorpay/verify-payment', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(String(req.params.id), 10);
    if (isNaN(invId)) {
      return sendError(res, 'INVALID_ID', 'Invoice ID must be a number', 400);
    }

    const invoice = await PortalService.getPortalInvoiceById(invId, req.user!);
    if (!invoice) {
      return sendError(res, 'NOT_FOUND', 'Invoice not found or unauthorized', 404);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const { RazorpayService } = await import('../services/razorpayService');
    const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return sendError(res, 'INVALID_SIGNATURE', 'Razorpay payment signature verification failed', 400);
    }

    const paymentAmount = amount || invoice.amountDue;
    const payment = await PortalService.recordPortalPayment(
      invId,
      req.user!,
      'bank',
      paymentAmount
    );

    // Refresh invoice and dispatch email with PDF receipt via Resend
    let emailResult = null;
    try {
      const { InvoiceService } = await import('../services/invoiceService');
      const updatedInvoice = await InvoiceService.getInvoiceById(invId);
      if (updatedInvoice) {
        const { EmailService } = await import('../services/emailService');
        emailResult = await EmailService.sendPaymentReceiptEmail({
          invoice: updatedInvoice,
          paymentAmount,
          paymentMethod: 'Razorpay Online Gateway',
          paymentRef: razorpay_payment_id,
          recipientEmail: req.user?.email || updatedInvoice.customerEmail,
        });
      }
    } catch (eErr: any) {
      console.warn('[PortalRoutes] Resend email dispatch notice:', eErr.message);
    }


    return sendSuccess(res, {
      success: true,
      payment,
      razorpayPaymentId: razorpay_payment_id,
      email: emailResult,
    });
  } catch (err: any) {
    return sendError(res, 'PAYMENT_ERROR', err.message, 400);
  }
});

// 8. GET /api/portal/contact-user/:contactId - Check if contact has portal user
portalRouter.get('/contact-user/:contactId', requireAuth, requireInternalUser, async (req: Request, res: Response) => {
  try {
    const contactId = parseInt(String(req.params.contactId), 10);
    if (isNaN(contactId)) {
      return sendError(res, 'INVALID_ID', 'Contact ID must be a number', 400);
    }
    const user = await PortalService.getContactUser(contactId);
    return sendSuccess(res, user);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 9. GET /api/portal/bills - Contact's OWN vendor bills only
portalRouter.get('/bills', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bills = await PortalService.getPortalBills(req.user!);
    return sendSuccess(res, bills);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 10. GET /api/portal/bills/:id - Specific vendor bill with lines & payments
portalRouter.get('/bills/:id', requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const billId = parseInt(String(req.params.id), 10);
    if (isNaN(billId)) {
      return sendError(res, 'INVALID_ID', 'Bill ID must be a number', 400);
    }

    const bill = await PortalService.getPortalBillById(billId, req.user!);
    if (!bill) {
      return sendError(res, 'NOT_FOUND', `Bill #${billId} not found or unauthorized`, 404);
    }

    return sendSuccess(res, bill);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 11. POST /api/portal/bills/:id/payments & /pay - Record payment on vendor bill from portal
portalRouter.post(['/bills/:id/payments', '/bills/:id/pay'], requireAuth, requirePortalContact, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const billId = parseInt(String(req.params.id), 10);
    if (isNaN(billId)) {
      return sendError(res, 'INVALID_ID', 'Bill ID must be a number', 400);
    }

    const parse = RecordPaymentSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, 'VALIDATION_ERROR', 'Method (cash|bank) and positive amount required', 400);
    }

    const payment = await PortalService.recordPortalBillPayment(
      billId,
      req.user!,
      parse.data.method,
      parse.data.amount
    );

    return sendSuccess(res, payment, 201);
  } catch (err: any) {
    return sendError(res, 'PAYMENT_ERROR', err.message || 'Failed to record bill payment', 400);
  }
});

