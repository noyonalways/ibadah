/**
 * Typed fetch client for the Ibadah API. Mirrors `client/src/lib/api.ts`
 * so both apps fail in the same shape and read the same envelope.
 */
import { authStorage } from './auth-storage';

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
  /** When true, attach the access token from local storage automatically. Default: true. */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Envelope returned by `api.raw()` — useful when callers need access to
 * `meta` (pagination, etc.) in addition to `data`.
 */
export interface ApiRawResponse<T> {
  data: T;
  message: string;
  meta?: Record<string, unknown>;
  details?: unknown;
}

async function apiRaw<T>(path: string, options: RequestOptions = {}): Promise<ApiRawResponse<T>> {
  const { method = 'GET', body, auth = true, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = authStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    cache: 'no-store',
    credentials: 'include',
  });

  let payload:
    | (ApiEnvelope<T> & { meta?: Record<string, unknown> })
    | { message?: string; details?: unknown }
    | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T> & { meta?: Record<string, unknown> };
  } catch {
    /* empty body is OK for some statuses */
  }

  if (!res.ok || (payload && 'success' in payload && payload.success === false)) {
    const message =
      (payload && 'message' in payload && payload.message) || `Request failed (${res.status})`;
    const details = payload && 'details' in payload ? payload.details : undefined;
    throw new ApiClientError(message, res.status, details);
  }

  const env = payload as ApiEnvelope<T> & { meta?: Record<string, unknown> };
  return { data: env.data, message: env.message, meta: env.meta, details: env.details };
}

interface ApiFn {
  <T>(path: string, options?: RequestOptions): Promise<T>;
  raw: <T>(path: string, options?: RequestOptions) => Promise<ApiRawResponse<T>>;
}

export const api: ApiFn = Object.assign(
  async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const env = await apiRaw<T>(path, options);
    return env.data;
  },
  { raw: apiRaw },
);

/** Hits the un-prefixed /health endpoint (NOT under /api/v1). */
export async function fetchHealth(): Promise<{ status: string; uptime: number }> {
  // baseUrl ends with /api/v1; strip it for /health.
  const root = baseUrl.replace(/\/api\/v\d+\/?$/, '');
  const res = await fetch(`${root}/health`, { cache: 'no-store' });
  if (!res.ok) throw new ApiClientError('Health check failed', res.status);
  return (await res.json()) as { status: string; uptime: number };
}
