/**
 * Admin AI Tools - Extended Administrative Capabilities
 *
 * These tools provide admins with full database access for analytics,
 * user management, moderation, and system administration through the AI assistant.
 */

import { Types } from 'mongoose';
import { User } from '@/modules/user/user.model';
import { ModerationFlag } from '@/modules/moderation/moderation.model';
import { adminAnalyticsService } from '@/modules/admin/analytics.service';
import { auditService } from '@/modules/audit/audit.service';
import { statsService } from '@/modules/stats/stats.service';
import type { ModerationStatus } from '@/modules/moderation/moderation.interface';
import type { ToolDefinition, ToolHandler, ToolRegistryEntry } from '@/modules/ai/tools/ai-tools.types';

// User Management Tools

const listUsersDefinition: ToolDefinition = {
  name: 'listUsers',
  description: 'List users with pagination and optional filters. Returns user details without sensitive data.',
  parameters: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
      },
      limit: {
        type: 'number',
        description: 'Items per page (default: 20, max: 100)',
      },
      search: {
        type: 'string',
        description: 'Search by name or email',
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by active status (true = not suspended)',
      },
      sortBy: {
        type: 'string',
        enum: ['createdAt', 'lastActiveAt', 'name'],
        description: 'Sort field',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order',
      },
    },
    required: [],
  },
};

const getUserDetailsDefinition: ToolDefinition = {
  name: 'getUserDetails',
  description: 'Get detailed information about a specific user including their activity summary.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID to look up',
      },
      includeStats: {
        type: 'boolean',
        description: 'Include worship statistics (default: true)',
      },
    },
    required: ['userId'],
  },
};

const suspendUserDefinition: ToolDefinition = {
  name: 'suspendUser',
  description: 'Suspend or unsuspend a user account. Requires admin privileges.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID to suspend/unsuspend',
      },
      suspend: {
        type: 'boolean',
        description: 'true to suspend, false to unsuspend',
      },
      reason: {
        type: 'string',
        description: 'Reason for suspension (required when suspending)',
      },
    },
    required: ['userId', 'suspend'],
  },
};

// Analytics Tools

const getPlatformAnalyticsDefinition: ToolDefinition = {
  name: 'getPlatformAnalytics',
  description: 'Get platform-wide analytics including signups, active users, and engagement metrics.',
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to analyze (default: 30, max: 90)',
      },
      includeBreakdown: {
        type: 'boolean',
        description: 'Include pillar breakdown (default: true)',
      },
    },
    required: [],
  },
};

const getUserActivityTrendsDefinition: ToolDefinition = {
  name: 'getUserActivityTrends',
  description: 'Analyze user activity trends over time for the platform.',
  parameters: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['dailyActiveUsers', 'newSignups', 'totalPoints', 'prayerCompletion', 'quranPages'],
        description: 'The metric to analyze',
      },
      days: {
        type: 'number',
        description: 'Number of days to analyze (default: 30, max: 365)',
      },
    },
    required: ['metric'],
  },
};

// Moderation Tools

const getModerationQueueDefinition: ToolDefinition = {
  name: 'getModerationQueue',
  description: 'Get the content moderation queue with pending items.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'hidden', 'removed', 'all'],
        description: 'Filter by moderation status',
      },
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
      },
      limit: {
        type: 'number',
        description: 'Items per page (default: 20)',
      },
    },
    required: [],
  },
};

const moderateContentDefinition: ToolDefinition = {
  name: 'moderateContent',
  description: 'Approve, reject, or flag content in the moderation queue.',
  parameters: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description: 'The moderation flag ID to act on',
      },
      action: {
        type: 'string',
        enum: ['approve', 'reject', 'flag'],
        description: 'The moderation action',
      },
      reason: {
        type: 'string',
        description: 'Reason / decision note',
      },
    },
    required: ['contentId', 'action'],
  },
};

// System Health Tools

const getSystemHealthDefinition: ToolDefinition = {
  name: 'getSystemHealth',
  description: 'Get system health status including database connectivity, service status, and resource usage.',
  parameters: {
    type: 'object',
    properties: {
      includeMetrics: {
        type: 'boolean',
        description: 'Include detailed metrics (default: true)',
      },
    },
    required: [],
  },
};

const getRecentAuditLogsDefinition: ToolDefinition = {
  name: 'getRecentAuditLogs',
  description: 'Get recent audit logs for administrative actions.',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Filter by action type',
      },
      actor: {
        type: 'string',
        description: 'Filter by actor (user id or email) who performed the action',
      },
      days: {
        type: 'number',
        description: 'Number of days to look back (default: 7, max: 30)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of logs to return (default: 50)',
      },
    },
    required: [],
  },
};

// Helpers

function toDayKeyString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Tool Handlers

const listUsersHandler: ToolHandler = async (args) => {
  const page = Math.max(1, (args.page as number) || 1);
  const limit = Math.min(100, Math.max(1, (args.limit as number) || 20));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (args.search) {
    query.$or = [
      { name: { $regex: args.search, $options: 'i' } },
      { email: { $regex: args.search, $options: 'i' } },
    ];
  }
  if (args.isActive !== undefined) {
    query.suspended = !(args.isActive as boolean);
  }

  const sortFieldMap: Record<string, string> = {
    createdAt: 'createdAt',
    lastActiveAt: 'lastActiveAt',
    name: 'name',
  };
  const sortField = sortFieldMap[(args.sortBy as string) ?? ''] ?? 'createdAt';
  const sortOrder = (args.sortOrder as string) === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email role suspended createdAt lastActiveAt')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      suspended: u.suspended,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getUserDetailsHandler: ToolHandler = async (args) => {
  const userId = args.userId as string;
  const includeStats = args.includeStats !== false;

  const user = await User.findById(userId).select('-passwordHash -__v').lean();
  if (!user) {
    throw new Error('User not found');
  }

  let stats = null;
  if (includeStats) {
    const [streaks, dailyPoints] = await Promise.all([
      statsService.streaks(userId),
      statsService.dailyPoints(
        userId,
        toDayKeyString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        toDayKeyString(new Date()),
      ),
    ]);

    const totalPoints = dailyPoints.reduce((sum, day) => sum + day.total, 0);

    stats = {
      totalPoints,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      activeDays: dailyPoints.filter((day) => day.total > 0).length,
      recentDaily: dailyPoints.slice(-7),
    };
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      suspended: user.suspended,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActiveAt: user.lastActiveAt,
    },
    stats,
  };
};

const suspendUserHandler: ToolHandler = async (args) => {
  const userId = args.userId as string;
  const suspend = args.suspend as boolean;
  const reason = args.reason as string | undefined;

  if (suspend && !reason) {
    throw new Error('Reason is required when suspending a user');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.suspended = suspend;
  await user.save();

  // Audit log is handled by the tool executor.
  return {
    success: true,
    userId,
    action: suspend ? 'suspended' : 'unsuspended',
    reason: reason || null,
    timestamp: new Date().toISOString(),
  };
};

// Analytics Handlers

const getPlatformAnalyticsHandler: ToolHandler = async (args) => {
  const days = Math.min((args.days as number) || 30, 90);
  const includeBreakdown = args.includeBreakdown !== false;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const overview = await adminAnalyticsService.overview({
    from: toDayKeyString(startDate),
    to: toDayKeyString(endDate),
  });

  return {
    period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    range: overview.range,
    signups: overview.signups,
    activeUsers: overview.activeUsers,
    pillars: includeBreakdown ? overview.pillars : null,
    distribution: overview.distribution,
    daily: overview.daily,
  };
};

const getUserActivityTrendsHandler: ToolHandler = async (args) => {
  const metric = args.metric as string;
  const days = Math.min((args.days as number) || 30, 365);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const overview = await adminAnalyticsService.overview({
    from: toDayKeyString(startDate),
    to: toDayKeyString(endDate),
  });

  const pick = (point: (typeof overview.daily)[number]): number => {
    switch (metric) {
      case 'dailyActiveUsers':
        return point.activeUsers;
      case 'newSignups':
        return point.signups;
      case 'totalPoints':
        return point.totalPoints;
      case 'prayerCompletion':
        return point.salahPoints;
      case 'quranPages':
        return point.quranPages;
      default:
        return point.totalPoints;
    }
  };

  return {
    metric,
    period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    data: overview.daily.map((point) => ({ date: point.date, value: pick(point) })),
  };
};

// Moderation Handlers

const getModerationQueueHandler: ToolHandler = async (args) => {
  const status = (args.status as string) || 'pending';
  const page = Math.max(1, (args.page as number) || 1);
  const limit = Math.min(100, Math.max(1, (args.limit as number) || 20));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (status !== 'all') {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    ModerationFlag.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ModerationFlag.countDocuments(query),
  ]);

  return {
    items: items.map((item) => ({
      id: item._id.toString(),
      targetType: item.targetType,
      targetId: item.targetId,
      user: item.user.toString(),
      contentSnapshot: item.contentSnapshot,
      contextSnapshot: item.contextSnapshot,
      reasons: item.reasons,
      status: item.status,
      decisionNote: item.decisionNote,
      decidedBy: item.decidedBy ? item.decidedBy.toString() : null,
      decidedAt: item.decidedAt,
      createdAt: item.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const moderateContentHandler: ToolHandler = async (args, context) => {
  const contentId = args.contentId as string;
  const action = args.action as string;
  const reason = args.reason as string | undefined;

  const flag = await ModerationFlag.findById(contentId);
  if (!flag) {
    throw new Error('Content not found in moderation queue');
  }

  const statusByAction: Record<string, ModerationStatus> = {
    approve: 'approved',
    reject: 'removed',
    flag: 'hidden',
  };
  const nextStatus = statusByAction[action];
  if (!nextStatus) {
    throw new Error(`Unknown moderation action: ${action}`);
  }

  flag.status = nextStatus;
  flag.decidedBy = new Types.ObjectId(context.userId);
  flag.decidedAt = new Date();
  if (reason) flag.decisionNote = reason;

  await flag.save();

  return {
    success: true,
    contentId,
    action,
    status: nextStatus,
    decidedAt: flag.decidedAt.toISOString(),
  };
};

// System Health Tools

const getSystemHealthHandler: ToolHandler = async (args) => {
  const includeMetrics = args.includeMetrics !== false;

  // Check database connectivity
  const dbStatus = await checkDatabaseHealth();

  // Get system metrics if requested
  let metrics = null;
  if (includeMetrics) {
    metrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  return {
    status: dbStatus.healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    metrics,
  };
};

async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    // Simple ping to check DB connectivity
    const { connection } = await import('mongoose');
    if (connection.readyState === 1) {
      return { healthy: true, latency: Date.now() - start };
    }
    return { healthy: false, latency: Date.now() - start, error: 'Database not connected' };
  } catch (error) {
    return { healthy: false, latency: Date.now() - start, error: (error as Error).message };
  }
}

const getRecentAuditLogsHandler: ToolHandler = async (args) => {
  const days = Math.min((args.days as number) || 7, 30);
  const limit = Math.min((args.limit as number) || 50, 200);
  const action = args.action as string | undefined;
  const actor = args.actor as string | undefined;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await auditService.list({
    from: toDayKeyString(startDate),
    action,
    actor,
    limit,
  });

  return {
    logs: result.items,
    filters: { days, action, actor },
    total: result.total,
  };
};

// Export Admin Tool Registry

export const adminTools: ToolRegistryEntry[] = [
  // User Management
  { definition: listUsersDefinition, handler: listUsersHandler, requireAdmin: true, auditLog: true },
  { definition: getUserDetailsDefinition, handler: getUserDetailsHandler, requireAdmin: true, auditLog: false },
  { definition: suspendUserDefinition, handler: suspendUserHandler, requireAdmin: true, auditLog: true },

  // Analytics
  { definition: getPlatformAnalyticsDefinition, handler: getPlatformAnalyticsHandler, requireAdmin: true, auditLog: false },
  { definition: getUserActivityTrendsDefinition, handler: getUserActivityTrendsHandler, requireAdmin: true, auditLog: false },

  // Moderation
  { definition: getModerationQueueDefinition, handler: getModerationQueueHandler, requireAdmin: true, auditLog: false },
  { definition: moderateContentDefinition, handler: moderateContentHandler, requireAdmin: true, auditLog: true },

  // System Health
  { definition: getSystemHealthDefinition, handler: getSystemHealthHandler, requireAdmin: true, auditLog: false },
  { definition: getRecentAuditLogsDefinition, handler: getRecentAuditLogsHandler, requireAdmin: true, auditLog: false },
];
