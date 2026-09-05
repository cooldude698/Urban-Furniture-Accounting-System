import { z } from 'zod';

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;

export const signupSchema = z.object({
  login_id: z
    .string()
    .min(6, 'Login ID must be at least 6 characters')
    .max(12, 'Login ID must be at most 12 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Login ID can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  password: z
    .string()
    .min(9, 'Password must be greater than 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one lowercase letter, one uppercase letter, and one special character'
    ),
  role: z.enum(['admin', 'user', 'accountant', 'manager', 'contact']).optional(),
});

export const loginSchema = z.object({
  login_id: z.string().min(1, 'Login ID is required').optional(),
  loginId: z.string().min(1, 'Login ID is required').optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => Boolean(data.login_id || data.loginId), {
  message: 'Login ID is required',
  path: ['login_id'],
}).transform(data => ({
  login_id: (data.login_id || data.loginId) as string,
  password: data.password,
}));

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = { login_id: string; password: string };

