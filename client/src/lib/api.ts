/**
 * Minimal typed fetch client for the Ibadah API. Handles:
 *  - Bearer token attachment
 *  - JSON body serialization
 *  - Unwrapping the standard { success, message, data } envelope
 */
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  cache?: RequestCache;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal, cache = 'no-store' } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    cache,
    credentials: 'include',
  });

  let payload: ApiEnvelope<T> | { message?: string; details?: unknown } | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* empty body is OK for some statuses */
  }

  if (!res.ok || (payload && 'success' in payload && payload.success === false)) {
    const message =
      (payload && 'message' in payload && payload.message) || `Request failed (${res.status})`;
    const details = payload && 'details' in payload ? payload.details : undefined;
    throw new ApiClientError(message, res.status, details);
  }

  return (payload as ApiEnvelope<T>).data;
}
