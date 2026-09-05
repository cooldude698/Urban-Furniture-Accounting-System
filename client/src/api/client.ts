export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    severity: 'blocking' | 'warning';
    fields?: Record<string, string>;
  } | null;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const json: ApiResponse<T> = await res.json();
  if (json.error) {
    const error = new Error(json.error.message) as any;
    error.code = json.error.code;
    error.severity = json.error.severity;
    error.fields = json.error.fields;
    throw error;
  }

  return json.data as T;
}
