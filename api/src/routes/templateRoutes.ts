import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TemplateService } from '../services/templateService';
import { TemplateExportService, ExportPayload } from '../services/templateExportService';
import { sendSuccess, sendError } from '../utils/response';
import { requireRole } from '../middleware/role';

export const templateRouter = Router();

// 1. GET /api/templates/categories - List all categories
templateRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await TemplateService.getCategories();
    return sendSuccess(res, categories);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 2. GET /api/templates/my/saved - List current user's saved templates
templateRouter.get('/my/saved', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);

    const saved = await TemplateService.getUserTemplates(userId);
    return sendSuccess(res, saved);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 3. POST /api/templates/my/save - Save customized template
const SaveUserTemplateSchema = z.object({
  templateId: z.number().int().positive(),
  name: z.string().min(1, 'Template name is required'),
  configuration: z.record(z.string(), z.any()).default({}),
  customData: z.record(z.string(), z.any()).default({}),
});

templateRouter.post('/my/save', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);

    const parse = SaveUserTemplateSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, 'VALIDATION_ERROR', parse.error.issues[0]?.message || 'Invalid input', 400);
    }

    const { templateId, name, configuration, customData } = parse.data;
    const saved = await TemplateService.saveUserTemplate(userId, templateId, name, configuration, customData);
    return sendSuccess(res, saved, 201);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 4. DELETE /api/templates/my/:id - Delete a saved template
templateRouter.delete('/my/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = parseInt(String(req.params.id), 10);
    if (!userId || isNaN(id)) return sendError(res, 'BAD_REQUEST', 'Invalid ID', 400);

    const ok = await TemplateService.deleteUserTemplate(userId, id);
    if (!ok) return sendError(res, 'NOT_FOUND', 'Template not found or unauthorized', 404);
    return sendSuccess(res, { deleted: true });
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 5. POST /api/templates/my/:id/duplicate - Duplicate a saved template
templateRouter.post('/my/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = parseInt(String(req.params.id), 10);
    if (!userId || isNaN(id)) return sendError(res, 'BAD_REQUEST', 'Invalid ID', 400);

    const duplicated = await TemplateService.duplicateUserTemplate(userId, id);
    if (!duplicated) return sendError(res, 'NOT_FOUND', 'Template not found or unauthorized', 404);
    return sendSuccess(res, duplicated, 201);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 6. GET /api/templates - List templates with search and category filters
templateRouter.get('/', async (req: Request, res: Response) => {
  try {
    const categorySlug = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const profession = req.query.profession as string | undefined;
    const includeInactive = req.query.includeInactive === 'true';

    const templates = await TemplateService.getTemplates({
      categorySlug,
      search,
      profession,
      includeInactive,
    });

    return sendSuccess(res, templates);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 7. GET /api/templates/:id - Get template detail by ID or slug
templateRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.id);
    const template = await TemplateService.getTemplateById(raw);
    if (!template) return sendError(res, 'NOT_FOUND', 'Template not found', 404);

    return sendSuccess(res, template);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 8. GET /api/templates/:id/erp-data - Fetch live ERP data for connected template
templateRouter.get('/:id/erp-data', async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.id);
    const template = await TemplateService.getTemplateById(raw);
    if (!template) return sendError(res, 'NOT_FOUND', 'Template not found', 404);

    const erpData = await TemplateService.getTemplateErpData(template.id);
    return sendSuccess(res, erpData);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// 9. POST /api/templates/:id/export/csv - Download as CSV
templateRouter.post('/:id/export/csv', async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.id);
    const template = await TemplateService.getTemplateById(raw);
    if (!template) return sendError(res, 'NOT_FOUND', 'Template not found', 404);

    const payload: ExportPayload = {
      template,
      config: req.body.config || {},
      rows: req.body.rows || template.previewData.rows || [],
    };

    const csvContent = TemplateExportService.generateCsv(payload);
    const filename = `${template.slug}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err: any) {
    return sendError(res, 'EXPORT_ERROR', err.message, 500);
  }
});

// 10. POST /api/templates/:id/export/xlsx - Download as XLSX (SpreadsheetML)
templateRouter.post('/:id/export/xlsx', async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.id);
    const template = await TemplateService.getTemplateById(raw);
    if (!template) return sendError(res, 'NOT_FOUND', 'Template not found', 404);

    const payload: ExportPayload = {
      template,
      config: req.body.config || {},
      rows: req.body.rows || template.previewData.rows || [],
    };

    const xmlContent = TemplateExportService.generateXlsxXml(payload);
    const filename = `${template.slug}-${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(xmlContent);
  } catch (err: any) {
    return sendError(res, 'EXPORT_ERROR', err.message, 500);
  }
});

// 11. POST /api/templates/:id/export/pdf - Download as PDF via Puppeteer (with printable HTML fallback)
templateRouter.post('/:id/export/pdf', async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.id);
    const template = await TemplateService.getTemplateById(raw);
    if (!template) return sendError(res, 'NOT_FOUND', 'Template not found', 404);

    const payload: ExportPayload = {
      template,
      config: req.body.config || {},
      rows: req.body.rows || template.previewData.rows || [],
    };

    try {
      const pdfBuffer = await TemplateExportService.generatePdf(payload);
      const filename = `${template.slug}-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(pdfBuffer);
    } catch (pdfErr: any) {
      console.warn('Puppeteer export fallback to printable HTML:', pdfErr.message);
      const html = TemplateExportService.generateHtml(payload);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${template.slug}-${Date.now()}.html"`);
      return res.status(200).send(html);
    }
  } catch (err: any) {
    return sendError(res, 'EXPORT_ERROR', err.message, 500);
  }
});

// 12. PATCH /api/templates/:id/status - Admin toggle active status
templateRouter.patch('/:id/status', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { isActive } = req.body;
    if (isNaN(id) || typeof isActive !== 'boolean') {
      return sendError(res, 'BAD_REQUEST', 'Invalid parameters', 400);
    }

    const ok = await TemplateService.toggleTemplateActive(id, isActive);
    if (!ok) return sendError(res, 'NOT_FOUND', 'Template not found', 404);
    return sendSuccess(res, { id, isActive });
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});
