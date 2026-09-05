import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../services/scope';
import { AuthService } from '../services/authService';
import { sendError } from '../utils/response';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

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
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as UserPayload;
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

/**
 * Ensures user is an internal staff member (admin, accountant, manager).
 * Blocks 'contact' users with 403 Forbidden.
 */
export function requireInternalUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    return;
  }

  if (req.user.role === 'contact') {
    sendError(
      res,
      'FORBIDDEN',
      'Access denied: Customer portal contacts cannot access internal administrative resources',
      403
    );
    return;
  }

  next();
}

/**
 * Ensures user is an external portal contact.
 * Blocks internal users from the customer-facing portal surface if necessary.
 */
export function requirePortalContact(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'contact') {
    sendError(
      res,
      'FORBIDDEN',
      'Access denied: This portal is strictly for customer contacts',
      403
    );
    return;
  }

  if (!req.user.contact_id) {
    sendError(res, 'FORBIDDEN', 'User is not linked to any customer record', 403);
    return;
  }

  next();
}

