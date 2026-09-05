import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { AuthenticatedRequest } from '../middleware/auth';
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

// GET /api/products/inventory-analytics
productRouter.get('/inventory-analytics', async (_req: Request, res: Response) => {
  try {
    const analytics = await ProductService.getInventoryAnalytics();
    return sendSuccess(res, analytics);
  } catch (err: any) {
    return sendError(res, 'ANALYTICS_FAILED', err.message);
  }
});

// GET /api/products/generate-sku
productRouter.get('/generate-sku', async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : 'GEN';
    const name = typeof req.query.name === 'string' ? req.query.name : 'ITEM';
    const year = typeof req.query.year === 'string' ? req.query.year : undefined;
    const sku = await ProductService.generateDeterministicSku(category, name, year);
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

// GET /api/products/available-models — List all imported GLB models from client/public/Models/
productRouter.get('/available-models', async (_req: Request, res: Response) => {
  try {
    const modelsDir = path.resolve(__dirname, '../../../client/public/Models');
    if (!fs.existsSync(modelsDir)) {
      return sendSuccess(res, []);
    }

    const files = fs.readdirSync(modelsDir);
    const glbFiles = files
      .filter(f => f.endsWith('.glb') || f.endsWith('.gltf'))
      .map(filename => {
        const fullPath = path.join(modelsDir, filename);
        const stat = fs.statSync(fullPath);
        // Clean display name (strip hash & creator if present)
        const displayName = filename.replace(/\.glb$/i, '').replace(/\s*-\s*[A-Za-z0-9_-]{8,15}$/, '');
        return {
          filename,
          name: displayName,
          sizeBytes: stat.size,
          sizeKB: (stat.size / 1024).toFixed(1),
          url: `/Models/${filename}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return sendSuccess(res, glbFiles);
  } catch (err: any) {
    return sendError(res, 'MODELS_LIST_FAILED', err.message);
  }
});

// POST /api/products/upload-model — Allow staff & furniture owners to upload a .glb model to client/public/Models/
productRouter.post('/upload-model', async (req: Request, res: Response) => {
  try {
    const { filename, fileData } = req.body;
    if (!filename || typeof filename !== 'string') {
      return sendError(res, 'INVALID_FILENAME', 'Filename is required');
    }
    if (!fileData || typeof fileData !== 'string') {
      return sendError(res, 'INVALID_DATA', 'Model file data (base64) is required');
    }

    // Sanitize filename — keep safe characters and ensure .glb extension
    const baseClean = path.basename(filename).replace(/[^a-zA-Z0-9._ -]/g, '_');
    const safeFilename = baseClean.toLowerCase().endsWith('.glb') || baseClean.toLowerCase().endsWith('.gltf')
      ? baseClean
      : `${baseClean}.glb`;

    const modelsDir = path.resolve(__dirname, '../../../client/public/Models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    const targetPath = path.join(modelsDir, safeFilename);

    // Extract base64 buffer (handling data:application/octet-stream;base64,... header if present)
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(targetPath, buffer);

    const stat = fs.statSync(targetPath);
    return sendSuccess(res, {
      filename: safeFilename,
      model_url: `/Models/${safeFilename}`,
      sizeBytes: stat.size,
      sizeKB: (stat.size / 1024).toFixed(1),
    }, 201);
  } catch (err: any) {
    return sendError(res, 'UPLOAD_FAILED', err.message);
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
    const product = await ProductService.create(req.body, (req as AuthenticatedRequest).user?.id);
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

    const updated = await ProductService.update(id, req.body, (req as AuthenticatedRequest).user?.id);
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
    const product = await ProductService.archive(id, isArchived, (req as AuthenticatedRequest).user?.id);
    if (!product) return sendError(res, 'NOT_FOUND', 'Product not found', 404);

    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});
