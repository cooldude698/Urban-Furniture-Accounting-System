import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { contactRouter } from './routes/contact.routes.js';
import { productRouter } from './routes/product.routes.js';
import { sendError } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// CORS with credentials: true
app.use(
  cors({
    origin: [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve local static uploaded images
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/contacts', contactRouter);
app.use('/api/products', productRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'urban-furniture-accounting' });
});

// 404 handler
app.use((_req, res) => {
  sendError(res, 'NOT_FOUND', 'Endpoint not found', 'blocking', 404);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  sendError(res, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred', 'blocking', 500);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
