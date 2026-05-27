/**
 * Thin per-feature wrappers around the typed `api()` client. Every
 * function in this file targets the server's `/admin/*` namespace
 * (which is gated by `requireAdmin` middleware) — we never touch
 * per-user resources from the admin panel because the admin's job is
 * to track and manage, not to author end-user content.
 */
import { api } from './api';

/* ----------------------------- Shared types ---------------------------- */

export type UserRole = 'user' | 'admin';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  suspended: boolean;
  lastActiveAt?: string;
  createdAt: string;
}

export interface SafeUser extends UserSummary {
  hasPassword?: boolean;
  hasGoogle?: boolean;
  locale?: 'en' | 'bn' | 'ar';
  timezone?: string;
}

/* ------------------------------- Metrics ------------------------------ */

export interface SystemMetrics {
  users: {
    total: number;
    admins: number;
    suspended: number;
    newLast7d: number;
    newLast30d: number;
  };
  active: { dau: number; wau: number; mau: number };
  content: {
    salahDays: number;
    quranDays: number;
    checklistDays: number;
    habitDays: number;
    dhikrDays: number;
    habitDefinitions: number;
    totalQuranPages: number;
  };
  generatedAt: string;
}

export const metricsApi = {
  get: () => api<SystemMetrics>('/admin/metrics'),
};

/* -------------------------------- Health ------------------------------ */

export interface ExtendedHealth {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  db: {
    state: 'connected' | 'connecting' | 'disconnected' | 'unknown';
    latencyMs: number | null;
    name: string | null;
  };
  memoryMb: { rss: number; heapUsed: number; heapTotal: number };
  nodeVersion: string;
  generatedAt: string;
}

export const adminHealthApi = {
  get: () => api<ExtendedHealth>('/admin/health'),
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
};

/* ------------------------------- Leaderboard ---------------------------- */

export interface LeaderboardEntry {
  user: UserSummary;
  totalPoints: number;
  salahPoints: number;
  habitPoints: number;
  checklistPoints: number;
  quranPages: number;
}

export interface LeaderboardParams {
  from?: string;
  to?: string;
  limit?: number;
}

export const leaderboardApi = {
  fetch: (params: LeaderboardParams = {}) =>
    api<LeaderboardEntry[]>(
      `/admin/leaderboard${toQueryString(params as Record<string, string | number | undefined>)}`,
    ),
};

/* ------------------------------- Active users -------------------------- */

export const activeUsersApi = {
  fetch: (params: { days?: number; limit?: number } = {}) =>
    api<UserSummary[]>(
      `/admin/active-users${toQueryString(params as Record<string, string | number | undefined>)}`,
    ),
};

/* -------------------------------- Defaults ----------------------------- */

export interface HabitDefault {
  name: string;
  description?: string;
  rewardPoints: number;
  color?: string;
  icon?: string;
}

export interface ChecklistDefault {
  title: string;
  rewardPoints: number;
}

export interface DhikrDefault {
  slug: string;
  label: string;
  arabic?: string;
  defaultTarget: number;
}

export interface DefaultsResult {
  habits: HabitDefault[];
  checklist: ChecklistDefault[];
  dhikr: DhikrDefault[];
  updatedBy?: string;
  updatedAt?: string;
}

export const defaultsApi = {
  get: () => api<DefaultsResult>('/admin/defaults'),
  update: (body: Pick<DefaultsResult, 'habits' | 'checklist' | 'dhikr'>) =>
    api<DefaultsResult>('/admin/defaults', { method: 'PUT', body }),
};

/* ------------------------------- Profile ------------------------------- */

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  locale: 'en' | 'bn' | 'ar';
  timezone: string;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  role: UserRole;
  suspended: boolean;
  createdAt: string;
}

export const profileApi = {
  get: () => api<AdminProfile>('/users/me'),
  update: (body: Partial<Pick<AdminProfile, 'name' | 'avatarUrl' | 'locale' | 'timezone'>>) =>
    api<AdminProfile>('/users/me', { method: 'PATCH', body }),
};
