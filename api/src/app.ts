import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authRouter } from './routes/authRoutes';
import { journalEntryRouter } from './routes/journalEntryRoutes';
import { salesOrderRouter } from './routes/salesOrderRoutes';
import { invoiceRouter } from './routes/invoiceRoutes';
import { paymentRouter } from './routes/paymentRoutes';
import { receivablesRouter } from './routes/receivablesRoutes';
import { portalRouter } from './routes/portalRoutes';
import { contactRouter } from './routes/contactRoutes';
import { reportRouter } from './routes/reportRoutes';
import { sendError } from './utils/response';

dotenv.config();

export const app: Express = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/portal', portalRouter);
app.use('/api/journal-entries', journalEntryRouter);
app.use('/api/sales-orders', salesOrderRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/receivables', receivablesRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/reports', reportRouter);


// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
  sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404);
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  sendError(res, 'INTERNAL_ERROR', err.message || 'Internal server error', 500);
});
