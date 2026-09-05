import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { sendSuccess, sendError } from '../utils/response';

export const receivablesRouter = Router();

// GET /api/receivables - Customer-wise total invoiced / total paid / total outstanding
receivablesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const summary = await PaymentService.getReceivablesSummary();
    return sendSuccess(res, summary);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});
