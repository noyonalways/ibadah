import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { adminService } from '@/modules/admin/admin.service';
import { adminAnalyticsService } from '@/modules/admin/analytics.service';
import { defaultsService } from '@/modules/admin/defaults.service';
import { auditService } from '@/modules/audit/audit.service';
import { moderationService } from '@/modules/moderation/moderation.service';
import type {
  ActiveUsersDto,
  AnalyticsRangeDto,
  LeaderboardDto,
  ListUsersDto,
  UpdateDefaultsDto,
  UpdateUserDto,
  UserAnalyticsDto,
} from '@/modules/admin/admin.validation';

const actorOf = (req: { user?: { id: string } }): string => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const adminController = {
  metrics: catchAsync(async (_req, res) => {
    const data = await adminService.metrics();
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'System metrics', data });
  }),

  listUsers: catchAsync(async (req, res) => {
    const data = await adminService.listUsers(req.query as ListUsersDto);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Users',
      data: data.items,
      meta: {
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      },
    });
  }),

  getUser: catchAsync(async (req, res) => {
    const data = await adminService.getUserDetail(req.params.id as string);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'User detail', data });
  }),

  updateUser: catchAsync(async (req, res) => {
    const userId = req.params.id as string;
    const body = req.body as UpdateUserDto;
    const before = await adminService.getUserSnapshot(userId);
    const data = await adminService.updateUser(actorOf(req), userId, body);

    // Emit a separate audit row per logical change so each line has a
    // single, scannable action.
    if (body.role && before && before.role !== body.role) {
      void auditService.recordFromRequest(req, {
        actorId: actorOf(req),
        action: body.role === 'admin' ? 'user.role.promote' : 'user.role.demote',
        target: { type: 'User', id: userId, label: data.email },
        diff: { role: { from: before.role, to: body.role } },
      });
    }
    if (body.suspended !== undefined && before && before.suspended !== body.suspended) {
      void auditService.recordFromRequest(req, {
        actorId: actorOf(req),
        action: body.suspended ? 'user.suspend' : 'user.unsuspend',
        target: { type: 'User', id: userId, label: data.email },
      });
    }
    if (body.name !== undefined && before && before.name !== body.name) {
      void auditService.recordFromRequest(req, {
        actorId: actorOf(req),
        action: 'user.update',
        target: { type: 'User', id: userId, label: data.email },
        diff: { name: { from: before.name, to: body.name } },
      });
    }
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'User updated', data });
  }),

  deleteUser: catchAsync(async (req, res) => {
    const userId = req.params.id as string;
    const before = await adminService.getUserSnapshot(userId);
    await adminService.deleteUser(actorOf(req), userId);
    void auditService.recordFromRequest(req, {
      actorId: actorOf(req),
      action: 'user.delete',
      target: {
        type: 'User',
        id: userId,
        label: before?.email,
      },
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'User deleted',
      data: { id: userId },
    });
  }),

  leaderboard: catchAsync(async (req, res) => {
    const data = await adminService.leaderboard(req.query as LeaderboardDto);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Leaderboard', data });
  }),

  activeUsers: catchAsync(async (req, res) => {
    const data = await adminService.activeUsers(req.query as ActiveUsersDto);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Active users', data });
  }),

  health: catchAsync(async (_req, res) => {
    const data = await adminService.extendedHealth();
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Extended health', data });
  }),

  getDefaults: catchAsync(async (_req, res) => {
    const data = await defaultsService.get();
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Defaults', data });
  }),

  updateDefaults: catchAsync(async (req, res) => {
    const data = await defaultsService.update(req.body as UpdateDefaultsDto, actorOf(req));
    void auditService.recordFromRequest(req, {
      actorId: actorOf(req),
      action: 'defaults.update',
      context: {
        habits: data.habits.length,
        checklist: data.checklist.length,
        dhikr: data.dhikr.length,
      },
    });
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Defaults updated', data });
  }),

  analyticsOverview: catchAsync(async (req, res) => {
    const data = await adminAnalyticsService.overview(req.query as AnalyticsRangeDto);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Analytics overview', data });
  }),

  userAnalytics: catchAsync(async (req, res) => {
    const data = await adminAnalyticsService.userAnalytics(
      req.params.id as string,
      req.query as UserAnalyticsDto,
    );
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'User analytics', data });
  }),

  /**
   * Aggregated dashboard payload — combines the cheapest-to-compute KPIs
   * the admin home screen needs in a single round-trip:
   *   - System counts (users / activity / content)
   *   - Extended health (db state + latency + memory)
   *   - 30-day timeline (signups + active users + total points)
   *   - Moderation queue size by status / type
   *   - Recent audit summary
   */
  dashboard: catchAsync(async (_req, res) => {
    const [metrics, health, analytics, moderation, audit] = await Promise.all([
      adminService.metrics(),
      adminService.extendedHealth(),
      adminAnalyticsService.overview({}),
      moderationService.overview(),
      auditService.recentSummary(7),
    ]);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Admin dashboard',
      data: {
        metrics,
        health,
        analytics,
        moderation,
        audit,
        generatedAt: new Date().toISOString(),
      },
    });
  }),
};
