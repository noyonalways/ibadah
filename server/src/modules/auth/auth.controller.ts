import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { authService } from './auth.service.js';

export const authController = {
  register: catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: 'Account created successfully',
      data: result,
    });
  }),

  login: catchAsync(async (req, res) => {
    const result = await authService.login(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Logged in successfully',
      data: result,
    });
  }),

  googleAuth: catchAsync(async (req, res) => {
    const result = await authService.googleAuth(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Logged in with Google',
      data: result,
    });
  }),

  refresh: catchAsync(async (req, res) => {
    const token =
      (req.body?.refreshToken as string | undefined) ??
      (req.cookies?.refreshToken as string | undefined);
    if (!token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
    }
    const result = await authService.refresh(token);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Token refreshed',
      data: result,
    });
  }),

  me: catchAsync(async (req, res) => {
    if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
    const user = await authService.getCurrentUser(req.user.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Current user',
      data: { user },
    });
  }),
};
