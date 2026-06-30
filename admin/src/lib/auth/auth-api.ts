import { api, ApiClientError } from '../api';
import { authStorage } from './auth-storage';
import type { AdminUser } from '@/store/auth-store';

interface AuthResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AdminUser> {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    authStorage.set(data.accessToken, data.refreshToken);
    return data.user;
  },

  async me(): Promise<AdminUser | null> {
    if (!authStorage.getAccess()) return null;
    try {
      const data = await api<{ user: AdminUser }>('/auth/me');
      return data.user;
    } catch (err) {
      // Only clear the session when the server has *explicitly* told us
      // the credentials are invalid. Transient errors (server down,
      // network blip, 5xx) MUST leave the persisted token alone — the
      // user is still logged in, and `useCurrentAdmin()` falls back to
      // the cached user from zustand persist for the duration.
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        authStorage.clear();
        return null;
      }
      throw err;
    }
  },

  logout() {
    authStorage.clear();
  },
};
