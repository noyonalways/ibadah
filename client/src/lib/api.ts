/**
 * Typed API helper for the Ibadah web client, built on the shared axios
 * instance (`./axios`). It:
 *  - Sends requests through the configured instance (cookies, base URL,
 *    `x-client-type`, and transparent token refresh all live there).
 *  - Optionally attaches a Bearer token (kept for parity with the mobile
 *    contract; the web flow leaves it null and relies on the cookie).
 *  - Unwraps the standard { success, message, data } envelope.
 */
import type { AxiosRequestConfig } from 'axios';

import { ApiClientError, axiosInstance } from './axios';

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
  token?: string | null;
  signal?: AbortSignal;
  /** Retained for source compatibility; axios manages caching via headers. */
  cache?: RequestCache;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const config: AxiosRequestConfig = {
    url: path,
    method,
    signal,
    ...(body !== undefined ? { data: body } : {}),
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };

  const res = await axiosInstance.request<ApiEnvelope<T>>(config);
  const payload = res.data;

  // Defensive: a 2xx response that still carries `success: false`.
  if (payload && payload.success === false) {
    throw new ApiClientError(payload.message || 'Request failed', res.status, payload.details);
  }

  return payload.data;
}
