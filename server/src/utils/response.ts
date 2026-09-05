import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    data,
    error: null,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  severity: 'blocking' | 'warning' = 'blocking',
  status = 400,
  fields?: Record<string, string>
) {
  return res.status(status).json({
    data: null,
    error: {
      code,
      message,
      severity,
      ...(fields ? { fields } : {}),
    },
  });
}
