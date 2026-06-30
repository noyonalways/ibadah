import { api } from '../api';
import { ApiClientError } from '../api';
import { authStorage } from './auth-storage';
import type { AuthUser } from '@/store/auth-store';

/**
 * In the web (cookie) flow the server returns only `{ user }` and sets the
 * access/refresh tokens as httpOnly cookies. The `accessToken` /
 * `refreshToken` fields are still typed as optional so this layer also
 * works against a server running in body-token mode (e.g. shared with the
 * mobile contract) without breaking.
 */
interface AuthResponse {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface GoogleExchangePayload {
  code: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const data = await api<AuthResponse>('/auth/register', { method: 'POST', body: payload });
    authStorage.markSession();
    return data.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const data = await api<AuthResponse>('/auth/login', { method: 'POST', body: payload });
    authStorage.markSession();
    return data.user;
  },

  /**
   * Redeem a one-time code minted by the server's OAuth callback. The
   * server sets the auth cookies and returns the user — same as a normal
   * login, so the SPA stores nothing but the session marker.
   */
  async exchangeGoogleCode(payload: GoogleExchangePayload): Promise<AuthUser> {
    const data = await api<AuthResponse>('/auth/google/exchange', {
      method: 'POST',
      body: payload,
    });
    authStorage.markSession();
    return data.user;
  },

  /**
   * Rehydrate the current user from the auth cookie. The `api` helper
   * transparently refreshes an expired access token before this call
   * fails, so a valid refresh cookie is enough to stay signed in.
   */
  async me(): Promise<AuthUser | null> {
    try {
      const data = await api<{ user: AuthUser }>('/auth/me');
      authStorage.markSession();
      return data.user;
    } catch (err) {
      // Only treat an explicit 401/403 as "logged out" — that means the
      // server rejected our cookies (and the silent refresh also failed).
      // Network / 5xx errors are transient: keep the session marker so
      // the cached user stays usable and we retry later.
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        authStorage.clear();
        return null;
      }
      throw err;
    }
  },

  /**
   * Log out. Tells the server to clear the httpOnly cookies, then drops
   * the local session marker. Best-effort on the network call — we clear
   * locally regardless so the UI always ends up logged out.
   */
  async logout(): Promise<void> {
    try {
      await api<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore — clearing the local marker below is what matters */
    } finally {
      authStorage.clear();
    }
  },
};
