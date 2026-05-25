import { api } from './api';
import { authStorage } from './auth-storage';
import type { AuthUser } from '@/store/auth-store';

export interface SalahScoring {
  onTimeAwwal: number;
  onTimeMid: number;
  onTimeLast: number;
  late: number;
  missed: number;
  sunnahNafil: number;
  witr: number;
}

export interface UserProfile extends AuthUser {
  scoring: SalahScoring;
}

const token = () => authStorage.getAccess();

export const userApi = {
  getMe: () => api<UserProfile>('/users/me', { token: token() }),
  updateMe: (payload: {
    name?: string;
    avatarUrl?: string;
    locale?: 'en' | 'bn' | 'ar';
    timezone?: string;
    scoring?: Partial<Omit<SalahScoring, 'late'>>;
  }) =>
    api<UserProfile>('/users/me', { method: 'PATCH', body: payload, token: token() }),
  resetScoring: () =>
    api<UserProfile>('/users/me/scoring/reset', { method: 'POST', token: token() }),
};
