import { Router, Request, Response } from 'express';
import { AccountService } from '../services/accountService';
import { sendSuccess, sendError } from '../utils/response';

export const accountRouter = Router();
export const journalRouter = Router();

// --- ACCOUNTS ROUTES ---

// GET /api/accounts
accountRouter.get('/', async (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const accounts = await AccountService.getAllAccounts(includeArchived, type);
    return sendSuccess(res, accounts);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/accounts/:id
accountRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const account = await AccountService.getAccountById(id);
    if (!account) return sendError(res, 'NOT_FOUND', 'Account not found', 404);

    return sendSuccess(res, account);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/accounts
accountRouter.post('/', async (req: Request, res: Response) => {
  try {
    const account = await AccountService.createAccount(req.body);
    return sendSuccess(res, account, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/accounts/:id
accountRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const updated = await AccountService.updateAccount(id, req.body);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Account not found', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/accounts/:id/archive
accountRouter.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const account = await AccountService.archiveAccount(id, isArchived);
    if (!account) return sendError(res, 'NOT_FOUND', 'Account not found', 404);

    return sendSuccess(res, account);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});

// --- JOURNALS ROUTES ---

// GET /api/journals
journalRouter.get('/', async (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const journals = await AccountService.getAllJournals(includeArchived, type);
    return sendSuccess(res, journals);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// GET /api/journals/:id
journalRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const journal = await AccountService.getJournalById(id);
    if (!journal) return sendError(res, 'NOT_FOUND', 'Journal not found', 404);

    return sendSuccess(res, journal);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message);
  }
});

// POST /api/journals
journalRouter.post('/', async (req: Request, res: Response) => {
  try {
    const journal = await AccountService.createJournal(req.body);
    return sendSuccess(res, journal, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message);
  }
});

// PUT /api/journals/:id
journalRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const updated = await AccountService.updateJournal(id, req.body);
    if (!updated) return sendError(res, 'NOT_FOUND', 'Journal not found', 404);

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message);
  }
});

// PATCH /api/journals/:id/archive
journalRouter.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const isArchived = req.body.is_archived !== undefined ? Boolean(req.body.is_archived) : true;
    const journal = await AccountService.archiveJournal(id, isArchived);
    if (!journal) return sendError(res, 'NOT_FOUND', 'Journal not found', 404);

    return sendSuccess(res, journal);
  } catch (err: any) {
    return sendError(res, 'ARCHIVE_FAILED', err.message);
  }
});
