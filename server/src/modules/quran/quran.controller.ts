import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { quranService } from '@/modules/quran/quran.service';

const userIdOf = (req: { user?: { id: string } }) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const quranController = {
  getDay: catchAsync(async (req, res) => {
    const data = await quranService.getDay(userIdOf(req), req.params.date as string);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Quran day fetched', data });
  }),
  upsertDay: catchAsync(async (req, res) => {
    const data = await quranService.upsertDay(userIdOf(req), req.params.date as string, req.body);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Quran day saved', data });
  }),
  listRange: catchAsync(async (req, res) => {
    const { from, to } = req.query as { from: string; to: string };
    const data = await quranService.listRange(userIdOf(req), from, to);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Quran range fetched', data });
  }),
};
