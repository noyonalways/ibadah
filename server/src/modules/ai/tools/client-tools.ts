/**
 * Client AI Tools - For Normal Users
 * 
 * These tools allow regular users to interact with their own data
 * and perform actions within their permission scope.
 */

import { statsService } from '@/modules/stats/stats.service';
import { salahService } from '@/modules/salah/salah.service';
import { quranService } from '@/modules/quran/quran.service';
import { dhikrService } from '@/modules/dhikr/dhikr.service';
import { habitService } from '@/modules/habit/habit.service';
import { checklistService } from '@/modules/checklist/checklist.service';
import { userService } from '@/modules/user/user.service';
import { adminService } from '@/modules/admin/admin.service';
import type { ToolDefinition, ToolHandler, ToolRegistryEntry } from '@/modules/ai/tools/ai-tools.types';

// Tool Definitions

const getUserStatsDefinition: ToolDefinition = {
  name: 'getUserStats',
  description: 'Retrieve the current user\'s worship statistics, including total points, streaks, and activity breakdown.',
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to look back for stats (default: 30, max: 90)',
      },
    },
    required: [],
  },
};

const getSalahHistoryDefinition: ToolDefinition = {
  name: 'getSalahHistory',
  description: 'Retrieve the user\'s prayer (Salah) tracking history for a date range.',
  parameters: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Start date in ISO format (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End date in ISO format (YYYY-MM-DD)',
      },
    },
    required: ['startDate', 'endDate'],
  },
};

const getQuranProgressDefinition: ToolDefinition = {
  name: 'getQuranProgress',
  description: 'Retrieve the user\'s Quran reading progress and statistics.',
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to look back (default: 30)',
      },
    },
    required: [],
  },
};

const getDhikrHistoryDefinition: ToolDefinition = {
  name: 'getDhikrHistory',
  description: 'Retrieve the user\'s dhikr (remembrance) tracking history.',
  parameters: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Start date in ISO format (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End date in ISO format (YYYY-MM-DD)',
      },
    },
    required: ['startDate', 'endDate'],
  },
};

const getHabitsProgressDefinition: ToolDefinition = {
  name: 'getHabitsProgress',
  description: 'Retrieve the user\'s habit tracking progress and completion rates.',
  parameters: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Start date in ISO format (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End date in ISO format (YYYY-MM-DD)',
      },
    },
    required: [],
  },
};

const calculatePointsDefinition: ToolDefinition = {
  name: 'calculatePoints',
  description: 'Calculate potential points for a set of worship activities. Useful for goal setting.',
  parameters: {
    type: 'object',
    properties: {
      fardPrayers: {
        type: 'number',
        description: 'Number of fard prayers (5 daily)',
      },
      sunnahPrayers: {
        type: 'number',
        description: 'Number of sunnah prayers',
      },
      quranPages: {
        type: 'number',
        description: 'Number of Quran pages read',
      },
      dhikrSessions: {
        type: 'number',
        description: 'Number of dhikr sessions',
      },
      habitsCompleted: {
        type: 'number',
        description: 'Number of habits completed',
      },
      days: {
        type: 'number',
        description: 'Number of days to calculate for (default: 1)',
      },
    },
    required: [],
  },
};

const getChecklistProgressDefinition: ToolDefinition = {
  name: 'getChecklistProgress',
  description: "Retrieve the user's daily checklist completion over a date range.",
  parameters: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
      endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
    },
    required: ['startDate', 'endDate'],
  },
};

const getDailySummaryDefinition: ToolDefinition = {
  name: 'getDailySummary',
  description: "Get a combined snapshot of the user's worship for a single day (salah, quran, dhikr, habits, checklist). Defaults to today.",
  parameters: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Date YYYY-MM-DD (default: today)' },
    },
    required: [],
  },
};

const getLeaderboardRankDefinition: ToolDefinition = {
  name: 'getLeaderboardRank',
  description: "Get the user's current leaderboard rank and points over a date range (default: last 30 days).",
  parameters: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Start date YYYY-MM-DD (default: 30 days ago)' },
      endDate: { type: 'string', description: 'End date YYYY-MM-DD (default: today)' },
    },
    required: [],
  },
};

const getProfileDefinition: ToolDefinition = {
  name: 'getProfile',
  description: "Get the user's own profile and preferences (name, locale, timezone, scoring config, default checklist template).",
  parameters: { type: 'object', properties: {}, required: [] },
};

// Tool Handlers

const getUserStatsHandler: ToolHandler = async (args, context) => {
  const days = Math.min((args.days as number) || 30, 90);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [streaks, dailyPoints] = await Promise.all([
    statsService.streaks(context.userId),
    statsService.dailyPoints(
      context.userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
  ]);

  const totalPoints = dailyPoints.reduce((sum, day) => sum + day.total, 0);
  const activeDays = dailyPoints.filter((day) => day.total > 0).length;

  return {
    totalPoints,
    activeDays,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    dailyBreakdown: dailyPoints.slice(-7),
    period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
  };
};

const getSalahHistoryHandler: ToolHandler = async (args, context) => {
  const { startDate, endDate } = args as { startDate: string; endDate: string };
  const days = await salahService.listRange(context.userId, startDate, endDate);

  return {
    days,
    summary: {
      totalDays: days.length,
      totalPoints: days.reduce((sum, day) => sum + day.totalPoints, 0),
      witrDays: days.filter((day) => day.witr).length,
      fridaysLogged: days.filter((day) => day.isFriday && day.jummah).length,
    },
  };
};

const getQuranProgressHandler: ToolHandler = async (args, context) => {
  const days = (args.days as number) || 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const entries = await quranService.listRange(
    context.userId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  const totalPages = entries.reduce((sum, entry) => sum + (entry.pagesRead ?? 0), 0);
  const avgPagesPerDay = entries.length > 0 ? totalPages / entries.length : 0;

  return {
    totalPages,
    avgPagesPerDay: Math.round(avgPagesPerDay * 10) / 10,
    entriesCount: entries.length,
    recentEntries: entries.slice(-5),
    period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
  };
};

const getDhikrHistoryHandler: ToolHandler = async (args, context) => {
  const { startDate, endDate } = args as { startDate: string; endDate: string };
  const days = await dhikrService.listRange(context.userId, startDate, endDate);

  let totalCount = 0;
  const bySlug: Record<string, number> = {};
  for (const day of days) {
    for (const entry of day.entries) {
      totalCount += entry.count;
      bySlug[entry.slug] = (bySlug[entry.slug] || 0) + entry.count;
    }
  }

  return {
    totalCount,
    daysCount: days.length,
    bySlug,
    recentDays: days.slice(-5),
  };
};

const getHabitsProgressHandler: ToolHandler = async (args, context) => {
  const endDate = new Date();
  const startDate = new Date();
  const days = 30;
  startDate.setDate(startDate.getDate() - days);

  if (args.startDate && args.endDate) {
    const s = new Date(args.startDate as string);
    const e = new Date(args.endDate as string);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      startDate.setTime(s.getTime());
      endDate.setTime(e.getTime());
    }
  }

  const [habits, dayLogs] = await Promise.all([
    habitService.listHabits(context.userId),
    habitService.listDayRange(
      context.userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
  ]);

  const completed = dayLogs.reduce(
    (sum, day) => sum + day.entries.filter((entry) => entry.completed).length,
    0,
  );
  const totalPossible = habits.length * days;
  const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

  return {
    totalHabits: habits.length,
    completionRate,
    completed,
    totalPossible,
    habits: habits.map((h) => ({
      id: h._id.toString(),
      name: h.name,
      rewardPoints: h.rewardPoints,
    })),
    recentDays: dayLogs.slice(-10),
  };
};

const calculatePointsHandler: ToolHandler = async (args) => {
  const fardPrayers = (args.fardPrayers as number) || 0;
  const sunnahPrayers = (args.sunnahPrayers as number) || 0;
  const quranPages = (args.quranPages as number) || 0;
  const dhikrSessions = (args.dhikrSessions as number) || 0;
  const habitsCompleted = (args.habitsCompleted as number) || 0;
  const days = (args.days as number) || 1;

  // Point calculation based on app scoring system
  const fardPoints = fardPrayers * 10; // 10 points per fard prayer
  const sunnahPoints = sunnahPrayers * 5; // 5 points per sunnah prayer
  const quranPoints = quranPages * 2; // 2 points per page
  const dhikrPoints = dhikrSessions * 3; // 3 points per session
  const habitPoints = habitsCompleted * 5; // 5 points per habit

  const dailyTotal = fardPoints + sunnahPoints + quranPoints + dhikrPoints + habitPoints;
  const totalPoints = dailyTotal * days;

  return {
    daily: {
      fardPrayers: fardPoints,
      sunnahPrayers: sunnahPoints,
      quranReading: quranPoints,
      dhikr: dhikrPoints,
      habits: habitPoints,
      total: dailyTotal,
    },
    totalForPeriod: totalPoints,
    days,
    breakdown: {
      prayers: fardPoints + sunnahPoints,
      spiritual: quranPoints + dhikrPoints,
      habits: habitPoints,
    },
  };
};

const getChecklistProgressHandler: ToolHandler = async (args, context) => {
  const { startDate, endDate } = args as { startDate: string; endDate: string };
  const days = enumerateDays(startDate, endDate, 62);
  const results = await Promise.all(days.map((d) => checklistService.getDay(context.userId, d)));

  let itemsCompleted = 0;
  let itemsTotal = 0;
  let totalPoints = 0;
  for (const day of results) {
    const items = (day as { items?: { completed?: boolean }[] }).items ?? [];
    itemsTotal += items.length;
    itemsCompleted += items.filter((i) => i.completed).length;
    totalPoints += (day as { totalPoints?: number }).totalPoints ?? 0;
  }

  return {
    daysCount: results.length,
    itemsCompleted,
    itemsTotal,
    completionRate: itemsTotal > 0 ? Math.round((itemsCompleted / itemsTotal) * 100) : 0,
    totalPoints,
    recentDays: results.slice(-7),
  };
};

const getDailySummaryHandler: ToolHandler = async (args, context) => {
  const date = (args.date as string) || new Date().toISOString().split('T')[0];
  const userId = context.userId;

  const [salah, quran, dhikr, habitDay, habits, checklist] = await Promise.all([
    salahService.getDay(userId, date),
    quranService.getDay(userId, date),
    dhikrService.getDay(userId, date),
    habitService.getDay(userId, date),
    habitService.listHabits(userId),
    checklistService.getDay(userId, date),
  ]);

  const dhikrEntries = (dhikr as { entries?: { count: number }[] }).entries ?? [];
  const habitEntries = (habitDay as { entries?: { completed?: boolean }[] }).entries ?? [];
  const checklistItems = (checklist as { items?: { completed?: boolean }[] }).items ?? [];

  return {
    date,
    salah: { totalPoints: salah.totalPoints, witr: salah.witr, isFriday: salah.isFriday },
    quran: {
      pagesRead: (quran as { pagesRead?: number }).pagesRead ?? 0,
      minutesRead: (quran as { minutesRead?: number }).minutesRead ?? 0,
    },
    dhikr: { totalCount: dhikrEntries.reduce((sum, e) => sum + (e.count ?? 0), 0) },
    habits: {
      totalDefined: habits.length,
      completed: habitEntries.filter((e) => e.completed).length,
      totalPoints: (habitDay as { totalPoints?: number }).totalPoints ?? 0,
    },
    checklist: {
      itemsTotal: checklistItems.length,
      completed: checklistItems.filter((i) => i.completed).length,
      totalPoints: (checklist as { totalPoints?: number }).totalPoints ?? 0,
    },
  };
};

const getLeaderboardRankHandler: ToolHandler = async (args, context) => {
  const entries = await adminService.leaderboard({
    from: args.startDate as string | undefined,
    to: args.endDate as string | undefined,
    limit: 100,
  });

  const index = entries.findIndex((entry) => entry.user.id === context.userId);
  const me = index >= 0 ? entries[index] : null;

  return {
    rank: index >= 0 ? index + 1 : null,
    rankedOutOf: entries.length,
    inTopRanked: index >= 0,
    note: index < 0 ? 'You are outside the ranked window (no points in range or below the top 100).' : undefined,
    totalPoints: me?.totalPoints ?? 0,
    breakdown: me
      ? {
          salahPoints: me.salahPoints,
          habitPoints: me.habitPoints,
          checklistPoints: me.checklistPoints,
          quranPages: me.quranPages,
        }
      : null,
  };
};

const getProfileHandler: ToolHandler = async (_args, context) => {
  const profile = await userService.getMe(context.userId);
  return { profile };
};

// Helpers

function enumerateDays(startStr: string, endStr: string, cap: number): string[] {
  const out: string[] = [];
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return out;
  for (let cur = new Date(start); cur <= end && out.length < cap; cur.setUTCDate(cur.getUTCDate() + 1)) {
    out.push(cur.toISOString().split('T')[0]);
  }
  return out;
}

// Tool Registry

export const clientTools: ToolRegistryEntry[] = [
  { definition: getUserStatsDefinition, handler: getUserStatsHandler },
  { definition: getDailySummaryDefinition, handler: getDailySummaryHandler },
  { definition: getSalahHistoryDefinition, handler: getSalahHistoryHandler },
  { definition: getQuranProgressDefinition, handler: getQuranProgressHandler },
  { definition: getDhikrHistoryDefinition, handler: getDhikrHistoryHandler },
  { definition: getHabitsProgressDefinition, handler: getHabitsProgressHandler },
  { definition: getChecklistProgressDefinition, handler: getChecklistProgressHandler },
  { definition: getLeaderboardRankDefinition, handler: getLeaderboardRankHandler },
  { definition: getProfileDefinition, handler: getProfileHandler },
  { definition: calculatePointsDefinition, handler: calculatePointsHandler },
];
