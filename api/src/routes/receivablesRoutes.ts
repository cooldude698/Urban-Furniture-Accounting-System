import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PaymentService } from '../services/paymentService';
import { StatementService } from '../services/statementService';
import { sendSuccess, sendError } from '../utils/response';
import { UserPayload } from '../services/scope';

export const receivablesRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

// GET /api/receivables - Customer-wise total invoiced / total paid / total outstanding
receivablesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        if (decoded.role === 'contact') {
          return sendError(res, 'FORBIDDEN', 'Access denied: Portal contacts cannot view general receivables ledger', 403);
        }
      } catch {
        // Invalid token
      }
    }

    const summary = await PaymentService.getReceivablesSummary();
    return sendSuccess(res, summary);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// GET /api/receivables/overdue - Overdue invoices summary for alerts
receivablesRouter.get('/overdue', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        if (decoded.role === 'contact') {
          return sendError(res, 'FORBIDDEN', 'Access denied', 403);
        }
      } catch {}
    }

    const overdueSummary = await StatementService.getOverdueInvoices();
    return sendSuccess(res, overdueSummary);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// GET /api/receivables/statements/:customerId - Chronological statement with running balance
receivablesRouter.get('/statements/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(String(req.params.customerId), 10);
    if (isNaN(customerId)) {
      return sendError(res, 'BAD_REQUEST', 'Invalid customer ID', 400);
    }

    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        if (decoded.role === 'contact' && decoded.contact_id !== customerId) {
          return sendError(res, 'FORBIDDEN', 'Access denied to other customer statements', 403);
        }
      } catch {}
    }

    const statement = await StatementService.getCustomerStatement(customerId);
    return sendSuccess(res, statement);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});
