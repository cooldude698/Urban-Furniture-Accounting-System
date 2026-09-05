import { Router, Request, Response } from 'express';
import { AnalyticService } from '../services/analytic.service.js';
import { CreateAnalyticAccountInputSchema, UpdateAnalyticAccountInputSchema } from '../../../shared/schemas/analytic.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const analyticRouter = Router();

// GET /api/analytic-accounts
analyticRouter.get('/', (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const analytics = AnalyticService.getAll(includeArchived, type);
    return sendSuccess(res, analytics);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/analytic-accounts/:id
analyticRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const item = AnalyticService.getById(id);
    if (!item) return sendError(res, 'NOT_FOUND', 'Analytic account not found', 'blocking', 404);

    return sendSuccess(res, item);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/analytic-accounts
analyticRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreateAnalyticAccountInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid analytic account data', 'blocking', 400, fieldErrors);
    }

    const item = AnalyticService.create(parsed.data);
    return sendSuccess(res, item, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/analytic-accounts/:id
analyticRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const parsed = UpdateAnalyticAccountInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid analytic account data', 'blocking', 400, fieldErrors);
    }

    const updated = AnalyticService.update(id, parsed.data);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Analytic account not found', 'blocking', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/analytic-accounts/:id/archive
analyticRouter.patch('/:id/archive', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const item = AnalyticService.archive(id, isArchived);
    if (!item) return sendError(res, 'NOT_FOUND', 'Analytic account not found', 'blocking', 404);

    return sendSuccess(res, item);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});
