import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { statsService } from '@/modules/stats/stats.service';

const userIdOf = (req: { user?: { id: string } }) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const statsController = {
  dailyPoints: catchAsync(async (req, res) => {
    const { from, to } = req.query as { from: string; to: string };
    const data = await statsService.dailyPoints(userIdOf(req), from, to);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Daily points', data });
  }),
  streaks: catchAsync(async (req, res) => {
    const data = await statsService.streaks(userIdOf(req));
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Streaks', data });
  }),
};
