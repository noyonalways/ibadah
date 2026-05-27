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
  meta?: Record<string, unknown>;
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
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

  return payload as ApiEnvelope<T>;
}

/**
 * Standard call: returns just `data`. Use this for the 90% case.
 */
export const api = Object.assign(
  async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const env = await request<T>(path, options);
    return env.data;
  },
  {
    /**
     * Escape hatch: returns the full envelope including `meta`. Used
     * for paginated endpoints where the controller surfaces `total`,
     * `page`, `limit`, etc. in `meta`.
     */
    raw<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
      return request<T>(path, options);
    },
  },
);

/** Hits the un-prefixed /health endpoint (NOT under /api/v1). */
export async function fetchHealth(): Promise<{ status: string; uptime: number }> {
  // baseUrl ends with /api/v1; strip it for /health.
  const root = baseUrl.replace(/\/api\/v\d+\/?$/, '');
  const res = await fetch(`${root}/health`, { cache: 'no-store' });
  if (!res.ok) throw new ApiClientError('Health check failed', res.status);
  return (await res.json()) as { status: string; uptime: number };
}
