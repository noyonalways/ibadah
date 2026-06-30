/**
 * Typed API helper for the Ibadah admin panel, built on the shared axios
 * instance (`./axios`). Mirrors `client/src/lib/api.ts` so both apps read
 * the same envelope and fail in the same shape (`ApiClientError`).
 *
 * The Bearer token is attached by the instance's request interceptor;
 * pass `auth: false` to opt out (e.g. the login call).
 */
import type { AxiosRequestConfig } from 'axios';

import { ApiClientError, axiosInstance, baseURL } from './axios';

export { ApiClientError };

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** When true (default), attach the access token via the interceptor. */
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

  const config: AxiosRequestConfig = {
    url: path,
    method,
    _auth: auth,
    signal,
    ...(body !== undefined ? { data: body } : {}),
  };

  const res = await axiosInstance.request<ApiEnvelope<T> & { meta?: Record<string, unknown> }>(
    config,
  );
  const env = res.data;

  // Defensive: a 2xx response that still carries `success: false`.
  if (env && env.success === false) {
    throw new ApiClientError(env.message || 'Request failed', res.status, env.details);
  }

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
  // baseURL ends with /api/v1; strip it for /health.
  const root = baseURL.replace(/\/api\/v\d+\/?$/, '');
  const res = await axiosInstance.get<{ status: string; uptime: number }>('/health', {
    baseURL: root,
    _auth: false,
  });
  return res.data;
}
