import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { adminService } from './admin.service.js';
import { adminAnalyticsService } from './analytics.service.js';
import { defaultsService } from './defaults.service.js';
import type {
  ActiveUsersDto,
  AnalyticsRangeDto,
  LeaderboardDto,
  ListUsersDto,
  UpdateDefaultsDto,
  UpdateUserDto,
  UserAnalyticsDto,
} from './admin.validation.js';

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
    const data = await adminService.updateUser(
      actorOf(req),
      req.params.id as string,
      req.body as UpdateUserDto,
    );
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'User updated', data });
  }),

  deleteUser: catchAsync(async (req, res) => {
    await adminService.deleteUser(actorOf(req), req.params.id as string);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'User deleted',
      data: { id: req.params.id },
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
};
