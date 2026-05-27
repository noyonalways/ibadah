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

/* ------------------------------ Analytics ----------------------------- */

export interface SalahPillarStats {
  totalDays: number;
  totalPoints: number;
  statusCounts: {
    pending: number;
    on_time_awwal: number;
    on_time_mid: number;
    on_time_last: number;
    late: number;
    missed: number;
  };
  sunnahCount: number;
  naflCount: number;
  witrCount: number;
  jummahCount: number;
}

export interface HabitsPillarStats {
  totalDays: number;
  totalPoints: number;
  completionsCount: number;
  totalEntries: number;
  /** Server omits this for per-user analytics. */
  definitionsCount?: number;
}

export interface ChecklistPillarStats {
  totalDays: number;
  totalPoints: number;
  itemsCompleted: number;
  itemsTotal: number;
}

export interface QuranPillarStats {
  totalDays: number;
  totalPages: number;
  totalMinutes: number;
}

export interface DhikrPillarStats {
  totalDays: number;
  totalCount: number;
  byPreset: { slug: string; label: string; count: number }[];
}

export interface AnalyticsPillars {
  salah: SalahPillarStats;
  habits: HabitsPillarStats;
  checklist: ChecklistPillarStats;
  quran: QuranPillarStats;
  dhikr: DhikrPillarStats;
}

export interface DailyAnalyticsPoint {
  date: string;
  signups: number;
  activeUsers: number;
  salahPoints: number;
  habitPoints: number;
  checklistPoints: number;
  quranPages: number;
  dhikrCount: number;
  totalPoints: number;
}

export interface AnalyticsRange {
  from: string;
  to: string;
  days: number;
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  signups: { total: number };
  activeUsers: { unique: number };
  pillars: AnalyticsPillars;
  daily: DailyAnalyticsPoint[];
  distribution: {
    totalUsers: number;
    participants: number;
    buckets: { label: string; min: number; max: number | null; count: number }[];
  };
  generatedAt: string;
}

export interface UserAnalyticsResult {
  range: AnalyticsRange;
  pillars: AnalyticsPillars;
  daily: DailyAnalyticsPoint[];
  generatedAt: string;
}

export const analyticsApi = {
  overview: (params: { from?: string; to?: string } = {}) =>
    api<AnalyticsOverview>(
      `/admin/analytics/overview${toQueryString(params as Record<string, string | number | undefined>)}`,
    ),
  forUser: (id: string, params: { from?: string; to?: string } = {}) =>
    api<UserAnalyticsResult>(
      `/admin/users/${id}/analytics${toQueryString(params as Record<string, string | number | undefined>)}`,
    ),
};

/* -------------------------------- Users ------------------------------- */

export interface ListUsersParams {
  search?: string;
  role?: UserRole;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'lastActive';
}

export interface ListUsersResponse {
  items: UserSummary[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface UserDetail {
  user: SafeUser;
  activity: {
    salahDays: number;
    quranDays: number;
    checklistDays: number;
    habitDays: number;
    dhikrDays: number;
    totalQuranPages: number;
    totalPoints: number;
    last30d: { date: string; total: number }[];
  };
}

export interface UpdateUserDto {
  role?: UserRole;
  suspended?: boolean;
  name?: string;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const usersApi = {
  list: async (params: ListUsersParams = {}): Promise<ListUsersResponse> => {
    // We need access to the meta envelope, which `api()` doesn't surface
    // by default. The simplest workaround: ride the same path but read
    // the raw response. Here we just call api() and synthesize meta from
    // payload length when total is unknown — but the server's controller
    // returns meta via the standard envelope, so we use a small helper.
    const url = `/admin/users${toQueryString(params as Record<string, string | number | undefined>)}`;
    const res = await api.raw<UserSummary[]>(url);
    return {
      items: res.data,
      meta: {
        page: (res.meta?.page as number) ?? 1,
        limit: (res.meta?.limit as number) ?? params.limit ?? 20,
        total: (res.meta?.total as number) ?? res.data.length,
        totalPages: (res.meta?.totalPages as number) ?? 1,
      },
    };
  },
  get: (id: string) => api<UserDetail>(`/admin/users/${id}`),
  update: (id: string, body: UpdateUserDto) =>
    api<SafeUser>(`/admin/users/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    api<{ id: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
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
