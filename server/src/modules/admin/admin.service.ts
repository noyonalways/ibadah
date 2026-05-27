import mongoose, { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/ApiError.js';
import { User } from '../user/user.model.js';
import type { SafeUser, UserRole } from '../user/user.interface.js';
import { SalahDay } from '../salah/salah.model.js';
import { QuranDay } from '../quran/quran.model.js';
import { ChecklistDay } from '../checklist/checklist.model.js';
import { Habit, HabitDay } from '../habit/habit.model.js';
import { DhikrDay } from '../dhikr/dhikr.model.js';
import { toDayKey, formatDayKey } from '../../utils/date.js';

/* --------------------------------------------------------------- *
 *  Helpers                                                          *
 * --------------------------------------------------------------- */

function dayBoundary(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  suspended: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

interface UserLean {
  _id: Types.ObjectId;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  suspended: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

function toUserSummary(u: UserLean): UserSummary {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
    suspended: u.suspended,
    lastActiveAt: u.lastActiveAt,
    createdAt: u.createdAt,
  };
}

/* --------------------------------------------------------------- *
 *  Metrics                                                          *
 * --------------------------------------------------------------- */

export interface SystemMetrics {
  users: {
    total: number;
    admins: number;
    suspended: number;
    newLast7d: number;
    newLast30d: number;
  };
  active: {
    /** Daily Active Users — distinct users with activity in last 24h. */
    dau: number;
    /** Weekly Active Users — last 7d. */
    wau: number;
    /** Monthly Active Users — last 30d. */
    mau: number;
  };
  content: {
    salahDays: number;
    quranDays: number;
    checklistDays: number;
    habitDays: number;
    dhikrDays: number;
    habitDefinitions: number;
    totalQuranPages: number;
  };
  generatedAt: Date;
}

async function computeMetrics(): Promise<SystemMetrics> {
  const oneDayAgo = dayBoundary(1);
  const sevenDaysAgo = dayBoundary(7);
  const thirtyDaysAgo = dayBoundary(30);

  const [
    totalUsers,
    admins,
    suspended,
    newLast7d,
    newLast30d,
    dau,
    wau,
    mau,
    salahDays,
    quranDays,
    checklistDays,
    habitDays,
    dhikrDays,
    habitDefinitions,
    quranAgg,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ suspended: true }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ lastActiveAt: { $gte: oneDayAgo } }),
    User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ lastActiveAt: { $gte: thirtyDaysAgo } }),
    SalahDay.estimatedDocumentCount(),
    QuranDay.estimatedDocumentCount(),
    ChecklistDay.estimatedDocumentCount(),
    HabitDay.estimatedDocumentCount(),
    DhikrDay.estimatedDocumentCount(),
    Habit.countDocuments({ archived: false }),
    QuranDay.aggregate<{ _id: null; total: number }>([
      { $group: { _id: null, total: { $sum: '$pagesRead' } } },
    ]),
  ]);

  return {
    users: {
      total: totalUsers,
      admins,
      suspended,
      newLast7d,
      newLast30d,
    },
    active: { dau, wau, mau },
    content: {
      salahDays,
      quranDays,
      checklistDays,
      habitDays,
      dhikrDays,
      habitDefinitions,
      totalQuranPages: quranAgg[0]?.total ?? 0,
    },
    generatedAt: new Date(),
  };
}

/* --------------------------------------------------------------- *
 *  Users                                                            *
 * --------------------------------------------------------------- */

interface ListUsersInput {
  search?: string;
  role?: UserRole;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'lastActive';
}

interface ListUsersResult {
  items: UserSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function listUsers(input: ListUsersInput): Promise<ListUsersResult> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));

  const filter: Record<string, unknown> = {};
  if (input.search) {
    const s = input.search.trim();
    if (s) {
      const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
  }
  if (input.role) filter.role = input.role;
  if (input.status === 'active') filter.suspended = false;
  if (input.status === 'suspended') filter.suspended = true;

  const sort: Record<string, 1 | -1> =
    input.sort === 'oldest'
      ? { createdAt: 1 }
      : input.sort === 'lastActive'
        ? { lastActiveAt: -1 }
        : { createdAt: -1 };

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email avatarUrl role suspended lastActiveAt createdAt')
      .lean<UserLean[]>(),
  ]);

  return {
    items: docs.map(toUserSummary),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

interface UserDetail {
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

async function getUserDetail(userId: string): Promise<UserDetail> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');
  }
  const user = await User.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  const userObj = user._id;

  const fromDate = dayBoundary(29); // last 30 days inclusive
  const toDate = toDayKey(new Date());

  const [salahCount, quranCount, checklistCount, habitCount, dhikrCount, quranAgg, daily] =
    await Promise.all([
      SalahDay.countDocuments({ user: userObj }),
      QuranDay.countDocuments({ user: userObj }),
      ChecklistDay.countDocuments({ user: userObj }),
      HabitDay.countDocuments({ user: userObj }),
      DhikrDay.countDocuments({ user: userObj }),
      QuranDay.aggregate<{ _id: null; total: number }>([
        { $match: { user: userObj } },
        { $group: { _id: null, total: { $sum: '$pagesRead' } } },
      ]),
      // Per-day total points across the last 30 days from the three
      // point-bearing collections (quran is page-based, not point-based).
      Promise.all([
        SalahDay.find({ user: userObj, date: { $gte: fromDate, $lte: toDate } })
          .select('date totalPoints')
          .lean(),
        HabitDay.find({ user: userObj, date: { $gte: fromDate, $lte: toDate } })
          .select('date totalPoints')
          .lean(),
        ChecklistDay.find({ user: userObj, date: { $gte: fromDate, $lte: toDate } })
          .select('date totalPoints')
          .lean(),
      ]),
    ]);

  const map = new Map<string, number>();
  const stash = (key: string, n: number) => map.set(key, (map.get(key) ?? 0) + (n ?? 0));
  for (const s of daily[0]) stash(formatDayKey(s.date), s.totalPoints ?? 0);
  for (const h of daily[1]) stash(formatDayKey(h.date), h.totalPoints ?? 0);
  for (const c of daily[2]) stash(formatDayKey(c.date), c.totalPoints ?? 0);
  const last30d = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  const totalPoints = last30d.reduce((s, d) => s + d.total, 0);

  return {
    user: user.toSafeJSON(),
    activity: {
      salahDays: salahCount,
      quranDays: quranCount,
      checklistDays: checklistCount,
      habitDays: habitCount,
      dhikrDays: dhikrCount,
      totalQuranPages: quranAgg[0]?.total ?? 0,
      totalPoints,
      last30d,
    },
  };
}

interface UpdateUserInput {
  role?: UserRole;
  suspended?: boolean;
  name?: string;
}

async function updateUser(
  actorId: string,
  userId: string,
  input: UpdateUserInput,
): Promise<SafeUser> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');
  }

  // Guard rail: an admin must not be able to demote / suspend themselves
  // (the system needs at least one active admin at all times).
  if (actorId === userId) {
    if (input.role && input.role !== 'admin') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot demote yourself');
    }
    if (input.suspended === true) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot suspend yourself');
    }
  }

  // Guard rail: the last admin can't be demoted away.
  if (input.role && input.role !== 'admin') {
    const target = await User.findById(userId).select('role').lean();
    if (target?.role === 'admin') {
      const otherAdmins = await User.countDocuments({
        role: 'admin',
        _id: { $ne: new Types.ObjectId(userId) },
        suspended: false,
      });
      if (otherAdmins === 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot demote the last active admin');
      }
    }
  }

  const update: Record<string, unknown> = {};
  if (input.role !== undefined) update.role = input.role;
  if (input.suspended !== undefined) update.suspended = input.suspended;
  if (input.name !== undefined) update.name = input.name;

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  return user.toSafeJSON();
}

async function deleteUser(actorId: string, userId: string): Promise<void> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');
  }
  if (actorId === userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot delete your own account');
  }

  const target = await User.findById(userId);
  if (!target) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  if (target.role === 'admin') {
    const otherAdmins = await User.countDocuments({
      role: 'admin',
      _id: { $ne: target._id },
      suspended: false,
    });
    if (otherAdmins === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot delete the last active admin');
    }
  }

  // Cascade — wipe all data the user owns. We don't run this in a
  // transaction (single-replica devs don't have one) but the operations
  // are idempotent so a partial failure is recoverable on retry.
  const userObj = target._id;
  await Promise.all([
    SalahDay.deleteMany({ user: userObj }),
    QuranDay.deleteMany({ user: userObj }),
    ChecklistDay.deleteMany({ user: userObj }),
    HabitDay.deleteMany({ user: userObj }),
    Habit.deleteMany({ user: userObj }),
    DhikrDay.deleteMany({ user: userObj }),
  ]);
  await User.deleteOne({ _id: userObj });
}

/* --------------------------------------------------------------- *
 *  Leaderboard & active users                                       *
 * --------------------------------------------------------------- */

export interface LeaderboardEntry {
  user: UserSummary;
  totalPoints: number;
  salahPoints: number;
  habitPoints: number;
  checklistPoints: number;
  quranPages: number;
}

interface LeaderboardInput {
  from?: string;
  to?: string;
  limit?: number;
}

async function leaderboard(input: LeaderboardInput): Promise<LeaderboardEntry[]> {
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const from = input.from ? toDayKey(input.from) : dayBoundary(29);
  const to = input.to ? toDayKey(input.to) : toDayKey(new Date());
  const dateMatch = { date: { $gte: from, $lte: to } };

  const sumByUser = async (
    Model: { aggregate: (p: object[]) => { exec: () => Promise<unknown[]> } },
    field: string,
  ): Promise<Map<string, number>> => {
    const out = (await Model.aggregate([
      { $match: dateMatch },
      { $group: { _id: '$user', total: { $sum: `$${field}` } } },
    ]).exec()) as { _id: Types.ObjectId; total: number }[];
    const m = new Map<string, number>();
    for (const row of out) m.set(row._id.toString(), row.total ?? 0);
    return m;
  };

  const [salahMap, habitMap, checklistMap, quranMap] = await Promise.all([
    sumByUser(SalahDay as unknown as Parameters<typeof sumByUser>[0], 'totalPoints'),
    sumByUser(HabitDay as unknown as Parameters<typeof sumByUser>[0], 'totalPoints'),
    sumByUser(ChecklistDay as unknown as Parameters<typeof sumByUser>[0], 'totalPoints'),
    sumByUser(QuranDay as unknown as Parameters<typeof sumByUser>[0], 'pagesRead'),
  ]);

  const userIds = new Set<string>([
    ...salahMap.keys(),
    ...habitMap.keys(),
    ...checklistMap.keys(),
    ...quranMap.keys(),
  ]);

  if (userIds.size === 0) return [];

  const users = await User.find({
    _id: { $in: Array.from(userIds).map((id) => new Types.ObjectId(id)) },
  })
    .select('name email avatarUrl role suspended lastActiveAt createdAt')
    .lean<UserLean[]>();

  const entries: LeaderboardEntry[] = users.map((u) => {
    const id = u._id.toString();
    const salahPoints = salahMap.get(id) ?? 0;
    const habitPoints = habitMap.get(id) ?? 0;
    const checklistPoints = checklistMap.get(id) ?? 0;
    const quranPages = quranMap.get(id) ?? 0;
    return {
      user: toUserSummary(u),
      totalPoints: salahPoints + habitPoints + checklistPoints,
      salahPoints,
      habitPoints,
      checklistPoints,
      quranPages,
    };
  });

  entries.sort((a, b) => b.totalPoints - a.totalPoints);
  return entries.slice(0, limit);
}

interface ActiveUsersInput {
  days?: number;
  limit?: number;
}

async function activeUsers(input: ActiveUsersInput): Promise<UserSummary[]> {
  const days = Math.min(365, Math.max(1, input.days ?? 7));
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const since = dayBoundary(days);

  const docs = await User.find({ lastActiveAt: { $gte: since } })
    .sort({ lastActiveAt: -1 })
    .limit(limit)
    .select('name email avatarUrl role suspended lastActiveAt createdAt')
    .lean<UserLean[]>();

  return docs.map(toUserSummary);
}

/* --------------------------------------------------------------- *
 *  Extended health                                                  *
 * --------------------------------------------------------------- */

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
  generatedAt: Date;
}

async function extendedHealth(): Promise<ExtendedHealth> {
  const stateMap: Record<number, ExtendedHealth['db']['state']> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected',
  };
  const conn = mongoose.connection;
  const dbState = stateMap[conn.readyState] ?? 'unknown';

  let latencyMs: number | null = null;
  if (dbState === 'connected' && conn.db) {
    const start = Date.now();
    try {
      await conn.db.admin().ping();
      latencyMs = Date.now() - start;
    } catch {
      latencyMs = null;
    }
  }

  const mem = process.memoryUsage();
  const mb = (n: number) => Math.round((n / 1024 / 1024) * 10) / 10;

  return {
    status: dbState === 'connected' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    db: {
      state: dbState,
      latencyMs,
      name: conn.name ?? null,
    },
    memoryMb: {
      rss: mb(mem.rss),
      heapUsed: mb(mem.heapUsed),
      heapTotal: mb(mem.heapTotal),
    },
    nodeVersion: process.version,
    generatedAt: new Date(),
  };
}

/* --------------------------------------------------------------- *
 *  Public surface                                                   *
 * --------------------------------------------------------------- */

export const adminService = {
  metrics: computeMetrics,
  listUsers,
  getUserDetail,
  updateUser,
  deleteUser,
  leaderboard,
  activeUsers,
  extendedHealth,
};
