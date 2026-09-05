import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { StatementService } from '../services/statementService';
import { sendSuccess, sendError } from '../utils/response';
import { UserPayload } from '../services/scope';

export const agingRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

// Middleware to block contact users from aging report
agingRouter.use((req: Request, res: Response, next) => {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      if (decoded.role === 'contact') {
        return sendError(
          res,
          'FORBIDDEN',
          'Access denied: Customer portal contacts cannot access aging reports',
          403
        );
      }
    } catch {
      // Invalid token
    }
  }
  next();
});

// GET /api/aging?type=receivable|payable&asOf=YYYY-MM-DD
agingRouter.get('/', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'receivable';
    const asOf = req.query.asOf as string | undefined;

    if (type === 'payable') {
      const report = await StatementService.getPayablesAgingReport(asOf);
      return sendSuccess(res, report);
    }

    const report = await StatementService.getReceivablesAgingReport(asOf);
    return sendSuccess(res, report);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});
