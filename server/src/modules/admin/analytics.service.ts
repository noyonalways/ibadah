/**
 * Admin analytics service. Heavy MongoDB aggregations live here.
 *
 * Two public methods:
 *   - overview({from, to})           — system-wide analytics dashboard
 *   - userAnalytics(userId, {from})  — per-user deep dive (timeline + pillars)
 *
 * Design notes:
 *   - All daily resources (salah/habit/checklist/quran/dhikr) are keyed
 *     by a UTC-midnight `date` Date. We work in that timezone throughout
 *     and only convert to YYYY-MM-DD strings at the response edge.
 *   - DAU is defined behaviorally: a "Daily Active User" is a distinct
 *     user that appears in *any* daily collection on that date. This is
 *     stricter than `lastActiveAt` (which counts mere auth activity) and
 *     answers "who actually logged worship today?".
 *   - All series fill in zero-rows for missing days. The frontend never
 *     has to handle gaps.
 */
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/ApiError.js';
import { User } from '../user/user.model.js';
import { SalahDay } from '../salah/salah.model.js';
import { QuranDay } from '../quran/quran.model.js';
import { ChecklistDay } from '../checklist/checklist.model.js';
import { Habit, HabitDay } from '../habit/habit.model.js';
import { DhikrDay } from '../dhikr/dhikr.model.js';
import { formatDayKey, toDayKey } from '../../utils/date.js';

/* ============================================================== *
 *  Date helpers                                                     *
 * ============================================================== */

/** Returns `[from, to]` as UTC-midnight Dates, defaulting to last 30d. */
function resolveRange(input: { from?: string; to?: string }): {
  from: Date;
  to: Date;
  days: number;
  dayKeys: string[];
} {
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  const to = input.to ? toDayKey(input.to) : todayUtc;

  let from: Date;
  if (input.from) {
    from = toDayKey(input.from);
  } else {
    const d = new Date(to);
    d.setUTCDate(d.getUTCDate() - 29);
    from = d;
  }

  if (from > to) {
    throw new ApiError(StatusCodes.BAD_REQUEST, '`from` must be before or equal to `to`');
  }

  const dayKeys: string[] = [];
  for (let cur = new Date(from); cur <= to; cur.setUTCDate(cur.getUTCDate() + 1)) {
    dayKeys.push(formatDayKey(cur));
  }

  return { from, to, days: dayKeys.length, dayKeys };
}

/* ============================================================== *
 *  Internal aggregation helpers                                     *
 * ============================================================== */

interface DailyAggRow<V = number> {
  _id: Date;
  value: V;
}

/**
 * Run a single $group-by-date aggregation against a daily collection.
 * Returns a Map keyed by YYYY-MM-DD so the caller can do `Map.get(key)`.
 */
async function aggregateDailySum(
  Model: { aggregate: (p: object[]) => { exec: () => Promise<unknown[]> } },
  match: object,
  field: string,
): Promise<Map<string, number>> {
  const out = (await Model.aggregate([
    { $match: match },
    { $group: { _id: '$date', value: { $sum: `$${field}` } } },
  ]).exec()) as DailyAggRow[];
  const m = new Map<string, number>();
  for (const row of out) m.set(formatDayKey(row._id), row.value ?? 0);
  return m;
}

/**
 * Aggregate per-day distinct user IDs. Used to compute DAU.
 */
async function aggregateDailyUsers(
  Model: { aggregate: (p: object[]) => { exec: () => Promise<unknown[]> } },
  match: object,
): Promise<Map<string, Set<string>>> {
  const out = (await Model.aggregate([
    { $match: match },
    { $group: { _id: '$date', users: { $addToSet: '$user' } } },
  ]).exec()) as { _id: Date; users: Types.ObjectId[] }[];

  const m = new Map<string, Set<string>>();
  for (const row of out) {
    const key = formatDayKey(row._id);
    const set = m.get(key) ?? new Set<string>();
    for (const u of row.users) set.add(u.toString());
    m.set(key, set);
  }
  return m;
}

function mergeUserMaps(maps: Map<string, Set<string>>[]): Map<string, number> {
  const merged = new Map<string, Set<string>>();
  for (const m of maps) {
    for (const [k, v] of m) {
      const set = merged.get(k) ?? new Set<string>();
      for (const id of v) set.add(id);
      merged.set(k, set);
    }
  }
  const counts = new Map<string, number>();
  for (const [k, set] of merged) counts.set(k, set.size);
  return counts;
}

/* ============================================================== *
 *  Salah pillar aggregation                                         *
 * ============================================================== */

interface SalahPillar {
  totalDays: number;
  totalPoints: number;
  statusCounts: Record<
    'pending' | 'on_time_awwal' | 'on_time_mid' | 'on_time_last' | 'late' | 'missed',
    number
  >;
  sunnahCount: number;
  naflCount: number;
  witrCount: number;
  jummahCount: number;
}

const ZERO_STATUS_COUNTS: SalahPillar['statusCounts'] = {
  pending: 0,
  on_time_awwal: 0,
  on_time_mid: 0,
  on_time_last: 0,
  late: 0,
  missed: 0,
};

async function computeSalahPillar(match: object): Promise<SalahPillar> {
  // Use a single facet to avoid 5 round-trips.
  const [agg] = (await SalahDay.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalDays: { $sum: 1 },
              totalPoints: { $sum: '$totalPoints' },
              witrCount: {
                $sum: { $cond: [{ $eq: ['$witr', true] }, 1, 0] },
              },
              jummahCount: {
                $sum: { $cond: [{ $ifNull: ['$jummah', false] }, 1, 0] },
              },
            },
          },
        ],
        statuses: [
          {
            $project: {
              statuses: [
                '$prayers.fajr.fard.status',
                '$prayers.dhuhr.fard.status',
                '$prayers.asr.fard.status',
                '$prayers.maghrib.fard.status',
                '$prayers.isha.fard.status',
              ],
            },
          },
          { $unwind: '$statuses' },
          { $match: { statuses: { $ne: null } } },
          { $group: { _id: '$statuses', count: { $sum: 1 } } },
        ],
        sunnah: [
          {
            $project: {
              before: [
                '$prayers.fajr.sunnahBefore',
                '$prayers.dhuhr.sunnahBefore',
                '$prayers.asr.sunnahBefore',
                '$prayers.maghrib.sunnahBefore',
                '$prayers.isha.sunnahBefore',
              ],
              after: [
                '$prayers.fajr.sunnahAfter',
                '$prayers.dhuhr.sunnahAfter',
                '$prayers.asr.sunnahAfter',
                '$prayers.maghrib.sunnahAfter',
                '$prayers.isha.sunnahAfter',
              ],
              nafl: [
                '$prayers.fajr.nafl',
                '$prayers.dhuhr.nafl',
                '$prayers.asr.nafl',
                '$prayers.maghrib.nafl',
                '$prayers.isha.nafl',
              ],
            },
          },
          {
            $project: {
              sunnahCount: {
                $size: {
                  $filter: {
                    input: { $concatArrays: ['$before', '$after'] },
                    as: 'b',
                    cond: { $eq: ['$$b', true] },
                  },
                },
              },
              naflCount: {
                $size: {
                  $filter: { input: '$nafl', as: 'b', cond: { $eq: ['$$b', true] } },
                },
              },
            },
          },
          { $group: { _id: null, sunnahCount: { $sum: '$sunnahCount' }, naflCount: { $sum: '$naflCount' } } },
        ],
      },
    },
  ]).exec()) as {
    totals: { totalDays: number; totalPoints: number; witrCount: number; jummahCount: number }[];
    statuses: { _id: string; count: number }[];
    sunnah: { sunnahCount: number; naflCount: number }[];
  }[];

  const totals = agg.totals[0] ?? {
    totalDays: 0,
    totalPoints: 0,
    witrCount: 0,
    jummahCount: 0,
  };
  const statusCounts: SalahPillar['statusCounts'] = { ...ZERO_STATUS_COUNTS };
  for (const s of agg.statuses) {
    if (s._id in statusCounts) {
      statusCounts[s._id as keyof SalahPillar['statusCounts']] = s.count;
    }
  }
  const sunnah = agg.sunnah[0] ?? { sunnahCount: 0, naflCount: 0 };

  return {
    totalDays: totals.totalDays,
    totalPoints: totals.totalPoints,
    statusCounts,
    sunnahCount: sunnah.sunnahCount,
    naflCount: sunnah.naflCount,
    witrCount: totals.witrCount,
    jummahCount: totals.jummahCount,
  };
}

/* ============================================================== *
 *  Habits / Checklist / Quran / Dhikr pillar aggregations           *
 * ============================================================== */

interface HabitsPillar {
  totalDays: number;
  totalPoints: number;
  completionsCount: number;
  totalEntries: number;
  /** Optional — only filled on the system overview, not per-user. */
  definitionsCount?: number;
}

async function computeHabitsPillar(match: object): Promise<HabitsPillar> {
  const [agg] = (await HabitDay.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalDays: { $sum: 1 },
              totalPoints: { $sum: '$totalPoints' },
            },
          },
        ],
        entries: [
          { $project: { entries: 1 } },
          { $unwind: { path: '$entries', preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: null,
              totalEntries: { $sum: 1 },
              completionsCount: {
                $sum: { $cond: [{ $eq: ['$entries.completed', true] }, 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]).exec()) as {
    totals: { totalDays: number; totalPoints: number }[];
    entries: { totalEntries: number; completionsCount: number }[];
  }[];

  return {
    totalDays: agg.totals[0]?.totalDays ?? 0,
    totalPoints: agg.totals[0]?.totalPoints ?? 0,
    completionsCount: agg.entries[0]?.completionsCount ?? 0,
    totalEntries: agg.entries[0]?.totalEntries ?? 0,
  };
}

interface ChecklistPillar {
  totalDays: number;
  totalPoints: number;
  itemsCompleted: number;
  itemsTotal: number;
}

async function computeChecklistPillar(match: object): Promise<ChecklistPillar> {
  const [agg] = (await ChecklistDay.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalDays: { $sum: 1 },
              totalPoints: { $sum: '$totalPoints' },
            },
          },
        ],
        items: [
          { $project: { items: 1 } },
          { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: null,
              itemsTotal: { $sum: 1 },
              itemsCompleted: {
                $sum: { $cond: [{ $eq: ['$items.completed', true] }, 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]).exec()) as {
    totals: { totalDays: number; totalPoints: number }[];
    items: { itemsTotal: number; itemsCompleted: number }[];
  }[];

  return {
    totalDays: agg.totals[0]?.totalDays ?? 0,
    totalPoints: agg.totals[0]?.totalPoints ?? 0,
    itemsCompleted: agg.items[0]?.itemsCompleted ?? 0,
    itemsTotal: agg.items[0]?.itemsTotal ?? 0,
  };
}

interface QuranPillar {
  totalDays: number;
  totalPages: number;
  totalMinutes: number;
}

async function computeQuranPillar(match: object): Promise<QuranPillar> {
  const [row] = (await QuranDay.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        totalPages: { $sum: '$pagesRead' },
        totalMinutes: { $sum: '$minutesRead' },
      },
    },
  ]).exec()) as { totalDays: number; totalPages: number; totalMinutes: number }[];

  return row ?? { totalDays: 0, totalPages: 0, totalMinutes: 0 };
}

interface DhikrPillar {
  totalDays: number;
  totalCount: number;
  byPreset: { slug: string; label: string; count: number }[];
}

async function computeDhikrPillar(match: object): Promise<DhikrPillar> {
  const [agg] = (await DhikrDay.aggregate([
    { $match: match },
    {
      $facet: {
        days: [{ $count: 'totalDays' }],
        byPreset: [
          { $project: { entries: 1 } },
          { $unwind: '$entries' },
          {
            $group: {
              _id: '$entries.slug',
              label: { $first: '$entries.label' },
              count: { $sum: '$entries.count' },
            },
          },
          { $sort: { count: -1 } },
        ],
      },
    },
  ]).exec()) as {
    days: { totalDays: number }[];
    byPreset: { _id: string; label: string; count: number }[];
  }[];

  const totalDays = agg.days[0]?.totalDays ?? 0;
  const byPreset = agg.byPreset.map((p) => ({
    slug: p._id,
    label: p.label || p._id,
    count: p.count,
  }));
  const totalCount = byPreset.reduce((s, p) => s + p.count, 0);

  return { totalDays, totalCount, byPreset };
}

/* ============================================================== *
 *  Score distribution (system-wide)                                 *
 * ============================================================== */

interface ScoreBucket {
  label: string;
  min: number;
  max: number | null; // null = open-ended
  count: number;
}

const DEFAULT_BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: '0', min: 0, max: 0 },
  { label: '1–50', min: 1, max: 50 },
  { label: '51–200', min: 51, max: 200 },
  { label: '201–500', min: 201, max: 500 },
  { label: '501–1000', min: 501, max: 1000 },
  { label: '1000+', min: 1001, max: null },
];

async function computeScoreDistribution(
  match: { date: { $gte: Date; $lte: Date } },
): Promise<{ totalUsers: number; participants: number; buckets: ScoreBucket[] }> {
  // points-per-user from each point-bearing pillar
  const sumByUser = async (
    Model: { aggregate: (p: object[]) => { exec: () => Promise<unknown[]> } },
    field: string,
  ): Promise<Map<string, number>> => {
    const out = (await Model.aggregate([
      { $match: match },
      { $group: { _id: '$user', total: { $sum: `$${field}` } } },
    ]).exec()) as { _id: Types.ObjectId; total: number }[];
    const m = new Map<string, number>();
    for (const row of out) m.set(row._id.toString(), row.total ?? 0);
    return m;
  };

  const [salahMap, habitMap, checklistMap, totalUsers] = await Promise.all([
    sumByUser(SalahDay as unknown as Parameters<typeof sumByUser>[0], 'totalPoints'),
    sumByUser(HabitDay as unknown as Parameters<typeof sumByUser>[0], 'totalPoints'),
    sumByUser(ChecklistDay as unknown as Parameters<typeof sumByUser>[0], 'totalPoints'),
    User.countDocuments({}),
  ]);

  const allUsers = new Set<string>([
    ...salahMap.keys(),
    ...habitMap.keys(),
    ...checklistMap.keys(),
  ]);

  const buckets: ScoreBucket[] = DEFAULT_BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const id of allUsers) {
    const total =
      (salahMap.get(id) ?? 0) + (habitMap.get(id) ?? 0) + (checklistMap.get(id) ?? 0);
    const bucket = buckets.find((b) => {
      if (total < b.min) return false;
      if (b.max === null) return true;
      return total <= b.max;
    });
    if (bucket) bucket.count += 1;
  }

  return {
    totalUsers,
    participants: allUsers.size,
    buckets,
  };
}

/* ============================================================== *
 *  Public surface                                                   *
 * ============================================================== */

export interface AnalyticsRange {
  from: string;
  to: string;
  days: number;
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

export interface AnalyticsOverview {
  range: AnalyticsRange;
  signups: { total: number };
  activeUsers: { unique: number };
  pillars: {
    salah: SalahPillar;
    habits: HabitsPillar;
    checklist: ChecklistPillar;
    quran: QuranPillar;
    dhikr: DhikrPillar;
  };
  daily: DailyAnalyticsPoint[];
  distribution: {
    totalUsers: number;
    participants: number;
    buckets: ScoreBucket[];
  };
  generatedAt: string;
}

async function overview(input: { from?: string; to?: string }): Promise<AnalyticsOverview> {
  const { from, to, dayKeys } = resolveRange(input);
  const dateMatch = { date: { $gte: from, $lte: to } };
  const createdMatch = { createdAt: { $gte: from, $lte: to } };

  // ---- Daily series (run all the per-day queries in parallel) ----
  const [
    signupsByDay,
    salahPointsByDay,
    habitPointsByDay,
    checklistPointsByDay,
    quranPagesByDay,
    dhikrCountAgg,
    salahUsersByDay,
    habitUsersByDay,
    checklistUsersByDay,
    quranUsersByDay,
    dhikrUsersByDay,
  ] = await Promise.all([
    // signups timeline — group users by createdAt at day-precision
    User.aggregate<{ _id: Date; value: number }>([
      { $match: createdMatch },
      {
        $group: {
          _id: {
            $dateFromParts: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
              timezone: 'UTC',
            },
          },
          value: { $sum: 1 },
        },
      },
    ]).then((rows) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(formatDayKey(r._id), r.value);
      return m;
    }),
    aggregateDailySum(
      SalahDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'totalPoints',
    ),
    aggregateDailySum(
      HabitDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'totalPoints',
    ),
    aggregateDailySum(
      ChecklistDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'totalPoints',
    ),
    aggregateDailySum(
      QuranDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'pagesRead',
    ),
    DhikrDay.aggregate<{ _id: Date; value: number }>([
      { $match: dateMatch },
      { $unwind: '$entries' },
      { $group: { _id: '$date', value: { $sum: '$entries.count' } } },
    ]).then((rows) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(formatDayKey(r._id), r.value);
      return m;
    }),
    aggregateDailyUsers(
      SalahDay as unknown as Parameters<typeof aggregateDailyUsers>[0],
      dateMatch,
    ),
    aggregateDailyUsers(
      HabitDay as unknown as Parameters<typeof aggregateDailyUsers>[0],
      dateMatch,
    ),
    aggregateDailyUsers(
      ChecklistDay as unknown as Parameters<typeof aggregateDailyUsers>[0],
      dateMatch,
    ),
    aggregateDailyUsers(
      QuranDay as unknown as Parameters<typeof aggregateDailyUsers>[0],
      dateMatch,
    ),
    aggregateDailyUsers(
      DhikrDay as unknown as Parameters<typeof aggregateDailyUsers>[0],
      dateMatch,
    ),
  ]);

  const dailyActiveUsers = mergeUserMaps([
    salahUsersByDay,
    habitUsersByDay,
    checklistUsersByDay,
    quranUsersByDay,
    dhikrUsersByDay,
  ]);

  // ---- Aggregates / pillars ----
  const [salah, habits, checklist, quran, dhikr, distribution, signupsTotal, definitionsCount] =
    await Promise.all([
      computeSalahPillar(dateMatch),
      computeHabitsPillar(dateMatch),
      computeChecklistPillar(dateMatch),
      computeQuranPillar(dateMatch),
      computeDhikrPillar(dateMatch),
      computeScoreDistribution(dateMatch),
      User.countDocuments(createdMatch),
      Habit.countDocuments({ archived: false }),
    ]);
  habits.definitionsCount = definitionsCount;

  // ---- Compose the daily series (zero-fill) ----
  const daily: DailyAnalyticsPoint[] = dayKeys.map((date) => {
    const salahPoints = salahPointsByDay.get(date) ?? 0;
    const habitPoints = habitPointsByDay.get(date) ?? 0;
    const checklistPoints = checklistPointsByDay.get(date) ?? 0;
    return {
      date,
      signups: signupsByDay.get(date) ?? 0,
      activeUsers: dailyActiveUsers.get(date) ?? 0,
      salahPoints,
      habitPoints,
      checklistPoints,
      quranPages: quranPagesByDay.get(date) ?? 0,
      dhikrCount: dhikrCountAgg.get(date) ?? 0,
      totalPoints: salahPoints + habitPoints + checklistPoints,
    };
  });

  // Unique active users over the entire window (distinct).
  const activeUnion = new Set<string>();
  for (const set of [
    ...salahUsersByDay.values(),
    ...habitUsersByDay.values(),
    ...checklistUsersByDay.values(),
    ...quranUsersByDay.values(),
    ...dhikrUsersByDay.values(),
  ]) {
    for (const id of set) activeUnion.add(id);
  }

  return {
    range: { from: formatDayKey(from), to: formatDayKey(to), days: dayKeys.length },
    signups: { total: signupsTotal },
    activeUsers: { unique: activeUnion.size },
    pillars: { salah, habits, checklist, quran, dhikr },
    daily,
    distribution,
    generatedAt: new Date().toISOString(),
  };
}

/* ============================================================== *
 *  Per-user analytics                                               *
 * ============================================================== */

export interface UserAnalytics {
  range: AnalyticsRange;
  pillars: {
    salah: SalahPillar;
    habits: HabitsPillar;
    checklist: ChecklistPillar;
    quran: QuranPillar;
    dhikr: DhikrPillar;
  };
  daily: DailyAnalyticsPoint[];
  generatedAt: string;
}

async function userAnalytics(
  userId: string,
  input: { from?: string; to?: string },
): Promise<UserAnalytics> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');
  }
  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const { from, to, dayKeys } = resolveRange(input);
  const userObj = new Types.ObjectId(userId);
  const dateMatch = { user: userObj, date: { $gte: from, $lte: to } };

  const [
    salah,
    habits,
    checklist,
    quran,
    dhikr,
    salahPointsByDay,
    habitPointsByDay,
    checklistPointsByDay,
    quranPagesByDay,
    dhikrCountByDay,
  ] = await Promise.all([
    computeSalahPillar(dateMatch),
    computeHabitsPillar(dateMatch),
    computeChecklistPillar(dateMatch),
    computeQuranPillar(dateMatch),
    computeDhikrPillar(dateMatch),
    aggregateDailySum(
      SalahDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'totalPoints',
    ),
    aggregateDailySum(
      HabitDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'totalPoints',
    ),
    aggregateDailySum(
      ChecklistDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'totalPoints',
    ),
    aggregateDailySum(
      QuranDay as unknown as Parameters<typeof aggregateDailySum>[0],
      dateMatch,
      'pagesRead',
    ),
    DhikrDay.aggregate<{ _id: Date; value: number }>([
      { $match: dateMatch },
      { $unwind: '$entries' },
      { $group: { _id: '$date', value: { $sum: '$entries.count' } } },
    ]).then((rows) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(formatDayKey(r._id), r.value);
      return m;
    }),
  ]);

  const daily: DailyAnalyticsPoint[] = dayKeys.map((date) => {
    const sp = salahPointsByDay.get(date) ?? 0;
    const hp = habitPointsByDay.get(date) ?? 0;
    const cp = checklistPointsByDay.get(date) ?? 0;
    const active = sp > 0 || hp > 0 || cp > 0 ? 1 : 0;
    return {
      date,
      signups: 0,
      activeUsers: active,
      salahPoints: sp,
      habitPoints: hp,
      checklistPoints: cp,
      quranPages: quranPagesByDay.get(date) ?? 0,
      dhikrCount: dhikrCountByDay.get(date) ?? 0,
      totalPoints: sp + hp + cp,
    };
  });

  return {
    range: { from: formatDayKey(from), to: formatDayKey(to), days: dayKeys.length },
    pillars: { salah, habits, checklist, quran, dhikr },
    daily,
    generatedAt: new Date().toISOString(),
  };
}

export const adminAnalyticsService = {
  overview,
  userAnalytics,
};
