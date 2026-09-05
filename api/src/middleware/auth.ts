import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../services/scope';
import { AuthService } from '../services/authService';
import { sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    // Verify user still exists in DB
    const user = await AuthService.getUserById(decoded.id);
    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'User no longer exists', 401);
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired authentication token', 401);
  }
}
