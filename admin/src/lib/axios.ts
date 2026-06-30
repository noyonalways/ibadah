/**
 * Shared axios instance for the Ibadah admin panel.
 *
 * The admin uses the **Bearer/body** auth mode (it deliberately does NOT
 * send `x-client-type: web`), so:
 *   - A request interceptor attaches `Authorization: Bearer <token>` from
 *     local storage, unless the call opts out via `config.auth = false`
 *     (e.g. the login request itself).
 *   - A response interceptor normalises every failure into an
 *     `ApiClientError` so callers can branch on `.status`.
 *
 * `withCredentials` is left on so the same instance keeps working if the
 * server is ever switched to cookie mode for the admin too.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios';

import { authStorage } from './auth/auth-storage';

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
  export interface AxiosRequestConfig {
    /**
     * Set to false to skip attaching the Bearer token (e.g. the login
     * call). Named `_auth` to avoid clashing with axios's built-in `auth`
     * (HTTP basic credentials).
     */
    _auth?: boolean;
  }
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  if (config._auth !== false) {
    const token = authStorage.getAccess();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

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
  (error: AxiosError) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    return Promise.reject(toApiClientError(error));
  },
);
