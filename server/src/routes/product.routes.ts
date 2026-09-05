import { Router, Request, Response } from 'express';
import { ProductService } from '../services/product.service.js';
import { CreateProductInputSchema, UpdateProductInputSchema } from '../../../shared/schemas/product.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const productRouter = Router();

// GET /api/products
productRouter.get('/', (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const products = ProductService.getAll(includeArchived, category, type);
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
productRouter.get('/alerts', (_req: Request, res: Response) => {
  try {
    const alerts = ProductService.getStockAlerts();
    return sendSuccess(res, alerts);
  } catch (err: any) {
    return sendError(res, 'ALERTS_FAILED', err.message);
  }
});

// GET /api/products/:id
productRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const product = ProductService.getById(id);
    if (!product) return sendError(res, 'NOT_FOUND', 'Product not found', 'blocking', 404);

    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/products
productRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreateProductInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid product data', 'blocking', 400, fieldErrors);
    }

    const product = ProductService.create(parsed.data);
    return sendSuccess(res, product, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/products/:id
productRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const parsed = UpdateProductInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid product data', 'blocking', 400, fieldErrors);
    }

    const updated = ProductService.update(id, parsed.data);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Product not found', 'blocking', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/products/:id/archive
productRouter.patch('/:id/archive', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const product = ProductService.archive(id, isArchived);
    if (!product) return sendError(res, 'NOT_FOUND', 'Product not found', 'blocking', 404);

    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});
