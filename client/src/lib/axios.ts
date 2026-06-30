/**
 * Shared axios instance for the Ibadah web client.
 *
 * Responsibilities baked into this single instance so every caller gets
 * consistent behaviour:
 *   - `baseURL` pointed at the API (`/api/v1`).
 *   - `withCredentials` so the httpOnly auth cookies ride along.
 *   - Identifies as a browser via `x-client-type: web`, which tells the
 *     server to authenticate via cookies (see server `utils/cookies.ts`).
 *   - A response interceptor that transparently refreshes an expired
 *     access token on a `401` and replays the original request once.
 *   - Normalises every failure into an `ApiClientError` so callers can
 *     branch on `.status` without poking at axios internals.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios';

export const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

declare module 'axios' {
  // Internal flag so the response interceptor only attempts a single
  // refresh+retry per request and never loops.
  export interface AxiosRequestConfig {
    _retried?: boolean;
  }
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'x-client-type': 'web',
  },
});

/**
 * Endpoints that must NOT trigger an automatic refresh on 401 — either
 * because they ARE the auth handshake (refreshing would loop) or because
 * a 401 there is a legitimate "bad credentials" answer the caller needs
 * to see verbatim.
 */
const NO_REFRESH_PREFIXES = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/google/exchange',
];

function isNoRefresh(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REFRESH_PREFIXES.some((p) => url.startsWith(p));
}

/**
 * A single shared refresh promise so a burst of concurrent 401s results
 * in exactly one call to `/auth/refresh`. All waiters reuse its result
 * and then retry their own request.
 */
let refreshInFlight: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = axiosInstance
      .post('/auth/refresh')
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/** Convert any axios failure into our typed `ApiClientError`. */
function toApiClientError(error: AxiosError): ApiClientError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as { message?: string; details?: unknown } | undefined;
  const message =
    (data && typeof data.message === 'string' && data.message) ||
    error.message ||
    `Request failed (${status})`;
  return new ApiClientError(message, status, data?.details);
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Let cancellations propagate untouched so React Query treats them as
    // cancellations rather than errors.
    if (axios.isCancel(error)) return Promise.reject(error);

    const config = error.config;
    const status = error.response?.status;

    if (status === 401 && config && !config._retried && !isNoRefresh(config.url)) {
      config._retried = true;
      const refreshed = await tryRefresh();
      if (refreshed) return axiosInstance(config);
    }

    return Promise.reject(toApiClientError(error));
  },
);
