import { Router, Request, Response } from 'express';
import { signupSchema, loginSchema } from '../shared/schemas/auth';
import { AuthService } from '../services/authService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export const authRouter = Router();

const isSecure = process.env.COOKIE_SECURE === 'true';

// POST /api/auth/signup - creates role='accountant' ONLY
authRouter.post('/signup', async (req: Request, res: Response) => {
  const parseResult = signupSchema.safeParse(req.body);
  if (!parseResult.success) {
    const fields: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = issue.path.join('.') || 'root';
      fields[key] = issue.message;
    }
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, 'blocking', fields);
  }

  try {
    const user = await AuthService.signup(parseResult.data);
    return sendSuccess(res, { user }, 201);
  } catch (err: any) {
    return sendError(res, 'SIGNUP_FAILED', err.message || 'Signup failed', 400);
  }
});

// POST /api/auth/login - JWT in httpOnly cookie, sameSite lax, secure false
authRouter.post('/login', async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 'INVALID_CREDENTIALS', 'Invalid Login Id or Password', 401);
  }

  try {
    const result = await AuthService.login(parseResult.data);

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { user: result.user }, 200);
  } catch (err: any) {
    // Exact error message required: "Invalid Login Id or Password"
    return sendError(res, 'INVALID_CREDENTIALS', 'Invalid Login Id or Password', 401);
  }
});

// POST /api/auth/logout - explicit server-side route
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
  });
  return sendSuccess(res, { message: 'Logged out successfully' });
});

// GET /api/auth/me - loads user from token
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { user: req.user });
});
