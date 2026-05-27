import { api } from './api';
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
    } catch {
      authStorage.clear();
      return null;
    }
  },

  logout() {
    authStorage.clear();
  },
};
