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

  const text = await res.text();
  let json: ApiResponse<T>;
  try {
    json = text ? JSON.parse(text) : { data: null, error: null };
  } catch {
    throw new Error(res.ok ? 'Invalid response from server' : `Request failed with status ${res.status}`);
  }

  if (json.error) {
    const error = new Error(json.error.message) as any;
    error.code = json.error.code;
    error.severity = json.error.severity;
    error.fields = json.error.fields;
    throw error;
  }

  if (!res.ok && !json.data) {
    throw new Error(`Server returned status ${res.status}`);
  }

  return json.data as T;
}
