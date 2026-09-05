import { Router, Request, Response } from 'express';
import { JournalEntryService } from '../services/journalEntryService';
import { createJournalEntrySchema } from '../shared/schemas/journalEntry';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { scopeFor } from '../services/scope';
import { sendSuccess, sendError } from '../utils/response';

export const journalEntryRouter = Router();

// Require authenticated accountant or admin for journal entries
journalEntryRouter.use(requireAuth);
journalEntryRouter.use(requireRole('admin', 'accountant', 'manager'));

// 1. GET /api/journal-entries - list: date, number, partner, journal, total, status
journalEntryRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scope = scopeFor(req.user!, 'journal_entry');
    if (scope.allowed === false) {
      return sendError(res, 'FORBIDDEN', 'Managers are restricted from raw financial ledger records', 403);
    }
    const list = await JournalEntryService.listEntries(scope);
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, 'LIST_FAILED', err.message || 'Failed to list journal entries', 500);
  }
});

// 2. GET /api/journal-entries/:id - with lines
journalEntryRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return sendError(res, 'INVALID_ID', 'Invalid journal entry ID', 400);
  }

  try {
    const scope = scopeFor(req.user!, 'journal_entry');
    if (scope.allowed === false) {
      return sendError(res, 'FORBIDDEN', 'Managers are restricted from raw financial ledger records', 403);
    }
    const entry = await JournalEntryService.getEntryById(id, scope);
    if (!entry) {
      return sendError(res, 'NOT_FOUND', `Journal entry ${id} not found`, 404);
    }
    return sendSuccess(res, entry);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message || 'Failed to fetch journal entry', 500);
  }
});

// 3. POST /api/journal-entries - manual entry, status draft
journalEntryRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const scope = scopeFor(req.user!, 'journal_entry');
  if (scope.allowed === false) {
    return sendError(res, 'FORBIDDEN', 'Managers are restricted from creating raw financial journal entries', 403);
  }
  const parseResult = createJournalEntrySchema.safeParse(req.body);
  if (!parseResult.success) {
    const fields: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = issue.path.join('.') || 'root';
      fields[key] = issue.message;
    }
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, 'blocking', fields);
  }

  try {
    const entry = await JournalEntryService.createManualEntry(parseResult.data, req.user?.id);
    return sendSuccess(res, entry, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message || 'Failed to create journal entry', 400);
  }
});

// 4. POST /api/journal-entries/:id/post
// If SUM(debit) != SUM(credit), return error with severity 'blocking' and message "Debit and credit amounts do not match."
journalEntryRouter.post('/:id/post', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return sendError(res, 'INVALID_ID', 'Invalid journal entry ID', 400);
  }

  try {
    const result = await JournalEntryService.postEntry(id, req.user?.id);
    return sendSuccess(res, result);
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    const severity = err.severity || 'blocking';
    const code = err.code || 'POST_FAILED';
    return sendError(res, code, err.message || 'Failed to post entry', statusCode, severity);
  }
});

// 5. POST /api/journal-entries/:id/reverse - creates mirrored entry with reversal_of set
journalEntryRouter.post('/:id/reverse', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return sendError(res, 'INVALID_ID', 'Invalid journal entry ID', 400);
  }

  try {
    const result = await JournalEntryService.reverseEntry(id, req.user?.id);
    return sendSuccess(res, result);
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    return sendError(res, err.code || 'REVERSAL_FAILED', err.message || 'Failed to reverse entry', statusCode);
  }
});

// 6. PUT /api/journal-entries/:id - block edit of posted entries
journalEntryRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return sendError(res, 'INVALID_ID', 'Invalid journal entry ID', 400);
  }

  const parseResult = createJournalEntrySchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400);
  }

  try {
    const updated = await JournalEntryService.updateDraftEntry(id, parseResult.data, req.user?.id);
    return sendSuccess(res, updated);
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    return sendError(res, err.code || 'UPDATE_FAILED', err.message || 'Failed to update entry', statusCode, 'blocking');
  }
});

// 7. DELETE /api/journal-entries/:id - block delete of posted entries
journalEntryRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return sendError(res, 'INVALID_ID', 'Invalid journal entry ID', 400);
  }

  try {
    const result = await JournalEntryService.deleteDraftEntry(id, req.user?.id);
    return sendSuccess(res, result);
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    return sendError(res, err.code || 'DELETE_FAILED', err.message || 'Failed to delete entry', statusCode, 'blocking');
  }
});
