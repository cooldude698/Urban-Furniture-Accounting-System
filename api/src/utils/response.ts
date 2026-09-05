import { Response } from 'express';

export type ErrorSeverity = 'blocking' | 'warning';

export interface ApiResponseError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  fields?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiResponseError | null;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
  const body: ApiResponse<T> = {
    data,
    error: null,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  severity: ErrorSeverity = 'blocking',
  fields?: Record<string, string>
): Response {
  const body: ApiResponse<null> = {
    data: null,
    error: {
      code,
      message,
      severity,
      ...(fields ? { fields } : {}),
    },
  };
  return res.status(statusCode).json(body);
}
