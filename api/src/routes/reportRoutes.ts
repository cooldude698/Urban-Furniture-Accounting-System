import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';
import { UserPayload } from '../services/scope';

export const reportRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware to block contact users from all reports
reportRouter.use((req: Request, res: Response, next) => {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      if (decoded.role === 'contact') {
        return sendError(
          res,
          'FORBIDDEN',
          'Access denied: Customer portal contacts cannot access financial reports',
          403
        );
      }
    } catch {
      // Invalid token
    }
  }
  next();
});

// GET /api/reports/balance-sheet
reportRouter.get('/balance-sheet', (req: Request, res: Response) => {
  res.json({ data: { message: 'Balance sheet report' }, error: null });
});

// GET /api/reports/profit-loss
reportRouter.get('/profit-loss', (req: Request, res: Response) => {
  res.json({ data: { message: 'Profit and loss report' }, error: null });
});
