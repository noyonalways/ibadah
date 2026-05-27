import { api } from './api';
import { authStorage } from './auth-storage';
import type { AuthUser } from '@/store/auth-store';

/**
 * Salah scoring config — kept in sync with `server/src/modules/salah/
 * salah.constants.ts`. Every field is required on the read side (the
 * server merges with defaults) and partial on the write side.
 */
export interface SalahScoring {
  fardAwwal: number;
  fardMid: number;
  fardLast: number;
  fardLate: number;
  fardMissed: number;
  sunnahBefore: number;
  sunnahAfter: number;
  nafl: number;
  witr: number;
  jummahFard: number;
  jummahKhutbah: number;
  jummahEarly: number;
  jummahSurahKahf: number;
  jummahGhusl: number;
}

export interface ChecklistTemplateItem {
  title: string;
  rewardPoints: number;
}

export interface UserProfile extends AuthUser {
  scoring: SalahScoring;
  defaultChecklistItems: ChecklistTemplateItem[];
}

const token = () => authStorage.getAccess();

export const userApi = {
  getMe: () => api<UserProfile>('/users/me', { token: token() }),
  updateMe: (payload: {
    name?: string;
    avatarUrl?: string;
    locale?: 'en' | 'bn' | 'ar';
    timezone?: string;
    scoring?: Partial<SalahScoring>;
    defaultChecklistItems?: ChecklistTemplateItem[];
  }) => api<UserProfile>('/users/me', { method: 'PATCH', body: payload, token: token() }),
  resetScoring: () =>
    api<UserProfile>('/users/me/scoring/reset', { method: 'POST', token: token() }),
};
