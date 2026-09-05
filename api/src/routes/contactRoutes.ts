import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/response';
import { UserPayload } from '../services/scope';

export const contactRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// GET /api/contacts - Lists contacts, strictly blocks portal contact users with 403
contactRouter.get('/', async (req: Request, res: Response) => {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      if (decoded.role === 'contact') {
        return sendError(
          res,
          'FORBIDDEN',
          'Access denied: Customer portal contacts cannot access internal contacts directory',
          403
        );
      }
    } catch {
      // Invalid token
    }
  }

  try {
    const type = req.query.type as string | undefined;
    let query = 'SELECT id, name, type, email, mobile, address, city, state, pincode FROM contacts WHERE is_archived = false';
    const params: any[] = [];
    if (type) {
      params.push(type);
      query += ' AND (type = $1 OR type = \'both\')';
    }
    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return sendSuccess(res, result.rows);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});
