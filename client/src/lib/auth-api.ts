import { api } from './api';
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
    } catch {
      authStorage.clear();
      return null;
    }
  },

  logout() {
    authStorage.clear();
  },
};
