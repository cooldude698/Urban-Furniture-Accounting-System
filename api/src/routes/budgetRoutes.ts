import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { withTransaction } from '../db/withTransaction';
import { sendSuccess, sendError } from '../utils/response';
import Decimal from 'decimal.js';

export const budgetRouter = Router();

// GET /api/budgets
budgetRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const resBudgets = await pool.query(`
      SELECT b.id, b.name, b.period_start, b.period_end, b.responsible_user_id,
             b.status, b.revised_of_id, b.created_at,
             (SELECT id FROM budgets WHERE revised_of_id = b.id LIMIT 1) AS revised_by_id,
             u.full_name AS responsible_name
      FROM budgets b
      LEFT JOIN users u ON b.responsible_user_id = u.id
      ORDER BY b.id DESC
    `);

    const budgets = resBudgets.rows;
    if (budgets.length === 0) return sendSuccess(res, []);

    const budgetIds = budgets.map(b => b.id);
    const linesRes = await pool.query(`
      SELECT bl.id, bl.budget_id, bl.analytic_account_id, bl.committed_amount,
             aa.name AS analytic_account_name, aa.type AS analytic_type,
             COALESCE(vbl.achieved_amount, 0)::TEXT AS achieved_amount,
             COALESCE(vbl.achieved_pct, 0)::NUMERIC AS achieved_pct
      FROM budget_lines bl
      JOIN analytic_accounts aa ON bl.analytic_account_id = aa.id
      LEFT JOIN v_budget_line_progress vbl ON bl.id = vbl.budget_line_id
      WHERE bl.budget_id = ANY($1)
      ORDER BY bl.id ASC
    `, [budgetIds]);

    const linesByBudget: Record<number, any[]> = {};
    for (const l of linesRes.rows) {
      if (!linesByBudget[l.budget_id]) linesByBudget[l.budget_id] = [];
      const comm = new Decimal(l.committed_amount || 0);
      const ach = new Decimal(l.achieved_amount || 0);
      const toAchieve = comm.minus(ach);
      linesByBudget[l.budget_id].push({
        id: l.id,
        budget_id: l.budget_id,
        analytic_account_id: l.analytic_account_id,
        analytic_account_name: l.analytic_account_name,
        analytic_type: l.analytic_type,
        committed_amount: comm.toFixed(2),
        achieved_amount: ach.toFixed(2),
        achieved_pct: Number(l.achieved_pct || 0),
        amount_to_achieve: toAchieve.toFixed(2),
      });
    }

    const result = budgets.map(b => ({
      id: b.id,
      name: b.name,
      period_start: b.period_start instanceof Date ? b.period_start.toISOString().split('T')[0] : String(b.period_start),
      period_end: b.period_end instanceof Date ? b.period_end.toISOString().split('T')[0] : String(b.period_end),
      responsible_user_id: b.responsible_user_id,
      responsible_name: b.responsible_name || 'Administrator',
      status: b.status,
      revised_of_id: b.revised_of_id,
      revised_by_id: b.revised_by_id || null,
      created_at: b.created_at,
      lines: linesByBudget[b.id] || [],
    }));

    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message, 500);
  }
});

// GET /api/budgets/:id
budgetRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const resBudget = await pool.query(`
      SELECT b.id, b.name, b.period_start, b.period_end, b.responsible_user_id,
             b.status, b.revised_of_id, b.created_at,
             (SELECT id FROM budgets WHERE revised_of_id = b.id LIMIT 1) AS revised_by_id,
             (SELECT name FROM budgets WHERE id = (SELECT id FROM budgets WHERE revised_of_id = b.id LIMIT 1)) AS revised_by_name,
             u.full_name AS responsible_name,
             p.name AS revised_of_name
      FROM budgets b
      LEFT JOIN users u ON b.responsible_user_id = u.id
      LEFT JOIN budgets p ON b.revised_of_id = p.id
      WHERE b.id = $1
    `, [id]);

    if (resBudget.rows.length === 0) return sendError(res, 'NOT_FOUND', 'Budget not found', 404);
    const b = resBudget.rows[0];

    const linesRes = await pool.query(`
      SELECT bl.id, bl.budget_id, bl.analytic_account_id, bl.committed_amount,
             aa.name AS analytic_account_name, aa.type AS analytic_type,
             COALESCE(vbl.achieved_amount, 0)::TEXT AS achieved_amount,
             COALESCE(vbl.achieved_pct, 0)::NUMERIC AS achieved_pct
      FROM budget_lines bl
      JOIN analytic_accounts aa ON bl.analytic_account_id = aa.id
      LEFT JOIN v_budget_line_progress vbl ON bl.id = vbl.budget_line_id
      WHERE bl.budget_id = $1
      ORDER BY bl.id ASC
    `, [id]);

    const lines = linesRes.rows.map(l => {
      const comm = new Decimal(l.committed_amount || 0);
      const ach = new Decimal(l.achieved_amount || 0);
      const toAchieve = comm.minus(ach);
      return {
        id: l.id,
        budget_id: l.budget_id,
        analytic_account_id: l.analytic_account_id,
        analytic_account_name: l.analytic_account_name,
        analytic_type: l.analytic_type,
        committed_amount: comm.toFixed(2),
        achieved_amount: ach.toFixed(2),
        achieved_pct: Number(l.achieved_pct || 0),
        amount_to_achieve: toAchieve.toFixed(2),
      };
    });

    return sendSuccess(res, {
      id: b.id,
      name: b.name,
      period_start: b.period_start instanceof Date ? b.period_start.toISOString().split('T')[0] : String(b.period_start),
      period_end: b.period_end instanceof Date ? b.period_end.toISOString().split('T')[0] : String(b.period_end),
      responsible_user_id: b.responsible_user_id,
      responsible_name: b.responsible_name || 'Administrator',
      status: b.status,
      revised_of_id: b.revised_of_id,
      revised_of_name: b.revised_of_name || null,
      revised_by_id: b.revised_by_id || null,
      revised_by_name: b.revised_by_name || null,
      created_at: b.created_at,
      lines,
    });
  } catch (err: any) {
    return sendError(res, 'FETCH_FAILED', err.message, 500);
  }
});

// POST /api/budgets
budgetRouter.post('/', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    const budgetId = await withTransaction(async tx => {
      const budgetRes = await tx.query<{ id: number }>(
        `INSERT INTO budgets (name, period_start, period_end, responsible_user_id, status)
         VALUES ($1, $2, $3, $4, 'draft')
         RETURNING id`,
        [b.name, b.period_start, b.period_end, b.responsible_user_id || 1]
      );
      const id = budgetRes.rows[0].id;

      for (const line of b.lines || []) {
        await tx.query(
          `INSERT INTO budget_lines (budget_id, analytic_account_id, committed_amount)
           VALUES ($1, $2, $3)`,
          [id, line.analytic_account_id, new Decimal(line.committed_amount || 0).toFixed(2)]
        );
      }
      return id;
    });

    const created = await fetchBudgetById(budgetId);
    return sendSuccess(res, created, 201);
  } catch (err: any) {
    return sendError(res, 'CREATE_FAILED', err.message, 400);
  }
});

// Helper to fetch full budget with lines
async function fetchBudgetById(id: number) {
  const resBudget = await pool.query(`
    SELECT b.id, b.name, b.period_start, b.period_end, b.responsible_user_id,
           b.status, b.revised_of_id, b.created_at,
           (SELECT id FROM budgets WHERE revised_of_id = b.id LIMIT 1) AS revised_by_id,
           (SELECT name FROM budgets WHERE id = (SELECT id FROM budgets WHERE revised_of_id = b.id LIMIT 1)) AS revised_by_name,
           u.full_name AS responsible_name,
           p.name AS revised_of_name
    FROM budgets b
    LEFT JOIN users u ON b.responsible_user_id = u.id
    LEFT JOIN budgets p ON b.revised_of_id = p.id
    WHERE b.id = $1
  `, [id]);

  if (resBudget.rows.length === 0) return null;
  const b = resBudget.rows[0];

  const linesRes = await pool.query(`
    SELECT bl.id, bl.budget_id, bl.analytic_account_id, bl.committed_amount,
           aa.name AS analytic_account_name, aa.type AS analytic_type,
           COALESCE(vbl.achieved_amount, 0)::TEXT AS achieved_amount,
           COALESCE(vbl.achieved_pct, 0)::NUMERIC AS achieved_pct
    FROM budget_lines bl
    JOIN analytic_accounts aa ON bl.analytic_account_id = aa.id
    LEFT JOIN v_budget_line_progress vbl ON bl.id = vbl.budget_line_id
    WHERE bl.budget_id = $1
    ORDER BY bl.id ASC
  `, [id]);

  const lines = linesRes.rows.map(l => {
    const comm = new Decimal(l.committed_amount || 0);
    const ach = new Decimal(l.achieved_amount || 0);
    const toAchieve = comm.minus(ach);
    return {
      id: l.id,
      budget_id: l.budget_id,
      analytic_account_id: l.analytic_account_id,
      analytic_account_name: l.analytic_account_name,
      analytic_type: l.analytic_type,
      committed_amount: comm.toFixed(2),
      achieved_amount: ach.toFixed(2),
      achieved_pct: Number(l.achieved_pct || 0),
      amount_to_achieve: toAchieve.toFixed(2),
    };
  });

  return {
    id: b.id,
    name: b.name,
    period_start: b.period_start instanceof Date ? b.period_start.toISOString().split('T')[0] : String(b.period_start),
    period_end: b.period_end instanceof Date ? b.period_end.toISOString().split('T')[0] : String(b.period_end),
    responsible_user_id: b.responsible_user_id,
    responsible_name: b.responsible_name || 'Administrator',
    status: b.status,
    revised_of_id: b.revised_of_id,
    revised_of_name: b.revised_of_name || null,
    revised_by_id: b.revised_by_id || null,
    revised_by_name: b.revised_by_name || null,
    created_at: b.created_at,
    lines,
  };
}

// PUT /api/budgets/:id
budgetRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const b = req.body;
    await withTransaction(async tx => {
      const origRes = await tx.query('SELECT status FROM budgets WHERE id = $1 FOR UPDATE', [id]);
      if (origRes.rows.length === 0) throw new Error('Budget not found');
      if (origRes.rows[0].status !== 'draft') {
        throw new Error('Only draft budgets can be modified');
      }

      await tx.query(
        `UPDATE budgets
         SET name = $1, period_start = $2, period_end = $3, responsible_user_id = $4
         WHERE id = $5`,
        [b.name, b.period_start, b.period_end, b.responsible_user_id || 1, id]
      );

      if (b.lines && Array.isArray(b.lines)) {
        await tx.query('DELETE FROM budget_lines WHERE budget_id = $1', [id]);
        for (const line of b.lines) {
          await tx.query(
            `INSERT INTO budget_lines (budget_id, analytic_account_id, committed_amount)
             VALUES ($1, $2, $3)`,
            [id, line.analytic_account_id, new Decimal(line.committed_amount || 0).toFixed(2)]
          );
        }
      }
    });

    const updated = await fetchBudgetById(id);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'UPDATE_FAILED', err.message, 400);
  }
});

// POST /api/budgets/:id/confirm
budgetRouter.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const check = await pool.query('SELECT status FROM budgets WHERE id = $1', [id]);
    if (check.rows.length === 0) return sendError(res, 'NOT_FOUND', 'Budget not found', 404);
    if (check.rows[0].status !== 'draft') {
      return sendError(res, 'INVALID_STATUS', 'Only draft budgets can be confirmed', 400);
    }

    await pool.query("UPDATE budgets SET status = 'confirmed' WHERE id = $1", [id]);
    const updated = await fetchBudgetById(id);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'CONFIRM_FAILED', err.message, 500);
  }
});

// POST /api/budgets/:id/cancel
budgetRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const check = await pool.query('SELECT status FROM budgets WHERE id = $1', [id]);
    if (check.rows.length === 0) return sendError(res, 'NOT_FOUND', 'Budget not found', 404);

    await pool.query("UPDATE budgets SET status = 'cancelled' WHERE id = $1", [id]);
    const updated = await fetchBudgetById(id);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, 'CANCEL_FAILED', err.message, 500);
  }
});

// POST /api/budgets/:id/revise
budgetRouter.post('/:id/revise', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendError(res, 'INVALID_ID', 'ID must be an integer');

    const result = await withTransaction(async tx => {
      const origRes = await tx.query(
        'SELECT * FROM budgets WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (origRes.rows.length === 0) {
        throw new Error('Budget not found');
      }
      const orig = origRes.rows[0];
      if (orig.status !== 'confirmed') {
        throw new Error('Only confirmed budgets can be revised.');
      }

      // Mark original as revised
      await tx.query(
        "UPDATE budgets SET status = 'revised' WHERE id = $1",
        [id]
      );

      // Create revised copy
      const newName = `${orig.name} Revised`;
      const newBudgetRes = await tx.query<{ id: number }>(
        `INSERT INTO budgets (name, period_start, period_end, responsible_user_id, status, revised_of_id)
         VALUES ($1, $2, $3, $4, 'confirmed', $5)
         RETURNING id`,
        [newName, orig.period_start, orig.period_end, orig.responsible_user_id, id]
      );
      const newId = newBudgetRes.rows[0].id;

      // Copy lines
      const linesRes = await tx.query(
        'SELECT analytic_account_id, committed_amount FROM budget_lines WHERE budget_id = $1',
        [id]
      );
      for (const line of linesRes.rows) {
        await tx.query(
          `INSERT INTO budget_lines (budget_id, analytic_account_id, committed_amount)
           VALUES ($1, $2, $3)`,
          [newId, line.analytic_account_id, line.committed_amount]
        );
      }

      return { originalId: id, revisedId: newId };
    });

    const original = await fetchBudgetById(result.originalId);
    const revised = await fetchBudgetById(result.revisedId);
    return sendSuccess(res, { original, revised });
  } catch (err: any) {
    return sendError(res, 'REVISE_FAILED', err.message, 400);
  }
});
