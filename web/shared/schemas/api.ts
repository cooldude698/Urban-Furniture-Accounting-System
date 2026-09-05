// Standard API response envelopes
export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    severity: 'blocking' | 'warning';
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function successResponse<T>(data: T): ApiSuccess<T> {
  return { data, error: null };
}

export function errorResponse(
  code: string,
  message: string,
  severity: 'blocking' | 'warning' = 'blocking',
  fields?: Record<string, string>
): ApiError {
  return {
    data: null,
    error: {
      code,
      message,
      severity,
      ...(fields ? { fields } : {}),
    },
  };
}
