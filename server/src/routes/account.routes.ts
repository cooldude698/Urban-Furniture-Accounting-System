import { Router, Request, Response } from 'express';
import { AccountService } from '../services/account.service.js';
import { CreateAccountInputSchema, UpdateAccountInputSchema, CreateJournalInputSchema, UpdateJournalInputSchema } from '../../../shared/schemas/account.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const accountRouter = Router();
export const journalRouter = Router();

// --- ACCOUNTS ROUTES ---

// GET /api/accounts
accountRouter.get('/', (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const accounts = AccountService.getAllAccounts(includeArchived, type);
    return sendSuccess(res, accounts);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/accounts/:id
accountRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const account = AccountService.getAccountById(id);
    if (!account) return sendError(res, 'NOT_FOUND', 'Account not found', 'blocking', 404);

    return sendSuccess(res, account);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/accounts
accountRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreateAccountInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid account data', 'blocking', 400, fieldErrors);
    }

    const account = AccountService.createAccount(parsed.data);
    return sendSuccess(res, account, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/accounts/:id
accountRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const parsed = UpdateAccountInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid account data', 'blocking', 400, fieldErrors);
    }

    const updated = AccountService.updateAccount(id, parsed.data);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Account not found', 'blocking', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/accounts/:id/archive
accountRouter.patch('/:id/archive', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const account = AccountService.archiveAccount(id, isArchived);
    if (!account) return sendError(res, 'NOT_FOUND', 'Account not found', 'blocking', 404);

    return sendSuccess(res, account);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});

// --- JOURNALS ROUTES ---

// GET /api/journals
journalRouter.get('/', (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const journals = AccountService.getAllJournals(includeArchived, type);
    return sendSuccess(res, journals);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/journals/:id
journalRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const journal = AccountService.getJournalById(id);
    if (!journal) return sendError(res, 'NOT_FOUND', 'Journal not found', 'blocking', 404);

    return sendSuccess(res, journal);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/journals
journalRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = CreateJournalInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid journal data', 'blocking', 400, fieldErrors);
    }

    const journal = AccountService.createJournal(parsed.data);
    return sendSuccess(res, journal, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/journals/:id
journalRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const parsed = UpdateJournalInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      return sendError(res, 'VALIDATION_ERROR', 'Invalid journal data', 'blocking', 400, fieldErrors);
    }

    const updated = AccountService.updateJournal(id, parsed.data);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Journal not found', 'blocking', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/journals/:id/archive
journalRouter.patch('/:id/archive', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const journal = AccountService.archiveJournal(id, isArchived);
    if (!journal) return sendError(res, 'NOT_FOUND', 'Journal not found', 'blocking', 404);

    return sendSuccess(res, journal);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});
