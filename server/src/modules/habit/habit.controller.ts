import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { habitService } from './habit.service.js';

const userIdOf = (req: { user?: { id: string } }) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const habitController = {
  list: catchAsync(async (req, res) => {
    const data = await habitService.listHabits(userIdOf(req));
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Habits fetched', data });
  }),
  create: catchAsync(async (req, res) => {
    const data = await habitService.createHabit(userIdOf(req), req.body);
    sendResponse(res, { statusCode: StatusCodes.CREATED, message: 'Habit created', data });
  }),
  update: catchAsync(async (req, res) => {
    const data = await habitService.updateHabit(userIdOf(req), req.params.id, req.body);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Habit updated', data });
  }),
  remove: catchAsync(async (req, res) => {
    await habitService.deleteHabit(userIdOf(req), req.params.id);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Habit deleted', data: null });
  }),
  getDay: catchAsync(async (req, res) => {
    const data = await habitService.getDay(userIdOf(req), req.params.date);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Habit day fetched', data });
  }),
  upsertDay: catchAsync(async (req, res) => {
    const data = await habitService.upsertDay(userIdOf(req), req.params.date, req.body.entries);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Habit day saved', data });
  }),
};
