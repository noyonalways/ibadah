import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { userService } from '@/modules/user/user.service';

const userIdOf = (req: { user?: { id: string } }) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const userController = {
  getMe: catchAsync(async (req, res) => {
    const data = await userService.getMe(userIdOf(req));
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Profile fetched', data });
  }),
  updateMe: catchAsync(async (req, res) => {
    const data = await userService.updateMe(userIdOf(req), req.body);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Profile updated', data });
  }),
  resetScoring: catchAsync(async (req, res) => {
    const data = await userService.resetScoring(userIdOf(req));
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Scoring reset to defaults', data });
  }),
};
