import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ContactService } from '../services/contact.service.js';
import { CreateContactInputSchema, UpdateContactInputSchema } from '../../../shared/schemas/contact.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../uploads/contacts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'contact-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const contactRouter = Router();

// GET /api/contacts
contactRouter.get('/', (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const contacts = ContactService.getAll(includeArchived, type);
    return sendSuccess(res, contacts);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/contacts/:id
contactRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const contact = ContactService.getById(id);
    if (!contact) return sendError(res, 'NOT_FOUND', 'Contact not found', 'blocking', 404);

    return sendSuccess(res, contact);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/contacts
contactRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreateContactInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid contact data', 'blocking', 400, fieldErrors);
    }

    const contact = ContactService.create(parsed.data);
    return sendSuccess(res, contact, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/contacts/:id
contactRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const parsed = UpdateContactInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid contact data', 'blocking', 400, fieldErrors);
    }

    const updated = ContactService.update(id, parsed.data);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Contact not found', 'blocking', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/contacts/:id/archive
contactRouter.patch('/:id/archive', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const contact = ContactService.archive(id, isArchived);
    if (!contact) return sendError(res, 'NOT_FOUND', 'Contact not found', 'blocking', 404);

    return sendSuccess(res, contact);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});

// POST /api/contacts/:id/image
contactRouter.post('/:id/image', upload.single('image'), (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    if (!req.file) return sendError(res, 'NO_FILE', 'No image file uploaded');

    const relativePath = `/uploads/contacts/${req.file.filename}`;
    const contact = ContactService.updateImage(id, relativePath);
    if (!contact) return sendError(res, 'NOT_FOUND', 'Contact not found', 'blocking', 404);

    return sendSuccess(res, contact);
  } catch (err: any) {
    return sendError(res, 'IMAGE_UPLOAD_FAILED', err.message);
  }
});
