/**
 * Thin per-feature wrappers around the typed `api()` client. One file
 * keeps the admin's transport surface easy to scan and easy to swap when
 * the server starts exposing real `/admin/*` endpoints (design.md §10.2).
 */
import { api } from './api';

/* ----------------------------- Stats ----------------------------- */

export interface DailyPoint {
  date: string;
  salah: number;
  habit: number;
  checklist: number;
  quranPages: number;
  total: number;
}

export const statsApi = {
  daily: (from: string, to: string) =>
    api<DailyPoint[]>(`/stats/daily?from=${from}&to=${to}`),
  streaks: () => api<{ current: number; longest: number }>('/stats/streaks'),
};

/* ----------------------------- Profile / Scoring ----------------------------- */

export interface ScoringConfig {
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

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  locale: 'en' | 'bn' | 'ar';
  timezone: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  isAdmin?: boolean;
  createdAt: string;
  scoring: ScoringConfig;
  defaultChecklistItems: { title: string; rewardPoints: number }[];
}

export const profileApi = {
  get: () => api<Profile>('/users/me'),
  update: (body: Partial<Pick<Profile, 'name' | 'avatarUrl' | 'locale' | 'timezone'>>) =>
    api<Profile>('/users/me', { method: 'PATCH', body }),
  updateScoring: (scoring: Partial<ScoringConfig>) =>
    api<Profile>('/users/me', { method: 'PATCH', body: { scoring } }),
  resetScoring: () => api<Profile>('/users/me/scoring/reset', { method: 'POST' }),
};

/* ----------------------------- Salah ----------------------------- */

export type PrayerStatus =
  | 'pending'
  | 'on_time_awwal'
  | 'on_time_mid'
  | 'on_time_last'
  | 'late'
  | 'missed';

export interface PrayerEntry {
  fard: { status: PrayerStatus };
  sunnahBefore: boolean;
  sunnahAfter: boolean;
  nafl: boolean;
  notes?: string;
}

export interface SalahDay {
  id: string | null;
  date: string;
  isFriday: boolean;
  prayers: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', PrayerEntry>;
  jummah?: PrayerEntry & {
    khutbah: boolean;
    earlyArrival: boolean;
    surahKahf: boolean;
    ghusl: boolean;
  };
  witr: boolean;
  totalPoints: number;
}

export const salahApi = {
  getDay: (date: string) => api<SalahDay>(`/salah/${date}`),
  upsertDay: (date: string, body: Partial<SalahDay>) =>
    api<SalahDay>(`/salah/${date}`, { method: 'PUT', body }),
  range: (from: string, to: string) =>
    api<SalahDay[]>(`/salah?from=${from}&to=${to}`),
};

/* ----------------------------- Quran ----------------------------- */

export interface QuranDay {
  date: string;
  pagesRead: number;
  minutesRead: number;
  surahFrom?: number;
  ayahFrom?: number;
  surahTo?: number;
  ayahTo?: number;
  notes?: string;
}

export const quranApi = {
  getDay: (date: string) => api<QuranDay>(`/quran/${date}`),
  upsertDay: (date: string, body: Partial<QuranDay>) =>
    api<QuranDay>(`/quran/${date}`, { method: 'PUT', body }),
  range: (from: string, to: string) =>
    api<QuranDay[]>(`/quran?from=${from}&to=${to}`),
};

/* ----------------------------- Dhikr ----------------------------- */

export interface DhikrEntry {
  slug: string;
  label: string;
  arabic?: string;
  target: number;
  count: number;
}

export interface DhikrPreset {
  slug: string;
  label: string;
  arabic?: string;
  defaultTarget: number;
}

export const dhikrApi = {
  presets: () => api<DhikrPreset[]>('/dhikr/presets'),
  getDay: (date: string) => api<{ date: string; entries: DhikrEntry[] }>(`/dhikr/${date}`),
  upsertDay: (date: string, entries: DhikrEntry[]) =>
    api(`/dhikr/${date}`, { method: 'PUT', body: { entries } }),
};

/* ----------------------------- Habits ----------------------------- */

export interface Habit {
  _id: string;
  name: string;
  description?: string;
  rewardPoints: number;
  archived: boolean;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitDayEntry {
  habit: string;
  completed: boolean;
}

export const habitApi = {
  list: () => api<Habit[]>('/habits'),
  create: (body: Partial<Habit>) => api<Habit>('/habits', { method: 'POST', body }),
  update: (id: string, body: Partial<Habit>) =>
    api<Habit>(`/habits/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<void>(`/habits/${id}`, { method: 'DELETE' }),
  getDay: (date: string) =>
    api<{ date: string; entries: HabitDayEntry[]; totalPoints: number }>(
      `/habits/days/${date}`,
    ),
  upsertDay: (date: string, entries: HabitDayEntry[]) =>
    api(`/habits/days/${date}`, { method: 'PUT', body: { entries } }),
};

/* ----------------------------- Checklist ----------------------------- */

export interface ChecklistItem {
  _id?: string;
  title: string;
  rewardPoints: number;
  completed: boolean;
  notes?: string;
}

export const checklistApi = {
  getDay: (date: string) =>
    api<{ date: string; items: ChecklistItem[]; totalPoints: number }>(`/checklist/${date}`),
  upsertDay: (date: string, items: ChecklistItem[]) =>
    api(`/checklist/${date}`, { method: 'PUT', body: { items } }),
};
