import { api } from './api';
import { ApiClientError } from './api';
import { authStorage } from './auth-storage';
import type { AuthUser } from '@/store/auth-store';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
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

interface GooglePayload {
  idToken: string;
  locale?: 'en' | 'bn' | 'ar';
  timezone?: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const data = await api<AuthResponse>('/auth/register', { method: 'POST', body: payload });
    authStorage.set(data.accessToken, data.refreshToken);
    return data.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const data = await api<AuthResponse>('/auth/login', { method: 'POST', body: payload });
    authStorage.set(data.accessToken, data.refreshToken);
    return data.user;
  },

  async google(payload: GooglePayload): Promise<AuthUser> {
    const data = await api<AuthResponse>('/auth/google', { method: 'POST', body: payload });
    authStorage.set(data.accessToken, data.refreshToken);
    return data.user;
  },

  async me(): Promise<AuthUser | null> {
    const token = authStorage.getAccess();
    if (!token) return null;
    try {
      const data = await api<{ user: AuthUser }>('/auth/me', { token });
      return data.user;
    } catch (err) {
      // Only clear the persisted session when the server has explicitly
      // told us the credentials are bad (401) or the account no longer
      // has access (403). Network failures, 5xx responses, CORS errors
      // and the server simply being down are TRANSIENT — the user's
      // tokens are still valid and should survive a refresh once the
      // server is reachable again.
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        authStorage.clear();
        return null;
      }
      // Surface anything else so React Query can retry / show an error
      // boundary; the persisted user in zustand keeps the UI usable.
      throw err;
    }
  },

  logout() {
    authStorage.clear();
  },
};
