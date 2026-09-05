import { Router, Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { sendSuccess, sendError } from '../utils/response';

export const productRouter = Router();

// GET /api/products
productRouter.get('/', async (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const products = await ProductService.getAll(includeArchived, category, type);
    return sendSuccess(res, products);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/products/generate-sku
productRouter.get('/generate-sku', (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : 'GEN';
    const name = typeof req.query.name === 'string' ? req.query.name : 'ITEM';
    const sku = ProductService.generateSku(category, name);
    return sendSuccess(res, { sku });
  } catch (err: any) {
    return sendError(res, 'SKU_GEN_FAILED', err.message);
  }
});

// GET /api/products/alerts
productRouter.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await ProductService.getStockAlerts();
    return sendSuccess(res, alerts);
  } catch (err: any) {
    return sendError(res, 'ALERTS_FAILED', err.message);
  }
});

// GET /api/products/:id
productRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const product = await ProductService.getById(id);
    if (!product) return sendError(res, 'NOT_FOUND', 'Product not found', 404);

    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/products
productRouter.post('/', async (req: Request, res: Response) => {
  try {
    const product = await ProductService.create(req.body);
    return sendSuccess(res, product, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/products/:id
productRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const updated = await ProductService.update(id, req.body);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Product not found', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/products/:id/archive
productRouter.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const product = await ProductService.archive(id, isArchived);
    if (!product) return sendError(res, 'NOT_FOUND', 'Product not found', 404);

    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});
