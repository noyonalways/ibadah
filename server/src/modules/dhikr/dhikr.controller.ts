import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { dhikrService } from '@/modules/dhikr/dhikr.service';

const userIdOf = (req: { user?: { id: string } }) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const dhikrController = {
  getPresets: catchAsync(async (_req, res) => {
    const data = await dhikrService.presets();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Dhikr presets',
      data,
    });
  }),
  getDay: catchAsync(async (req, res) => {
    const data = await dhikrService.getDay(userIdOf(req), req.params.date as string);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Dhikr day fetched', data });
  }),
  upsertDay: catchAsync(async (req, res) => {
    const data = await dhikrService.upsertDay(
      userIdOf(req),
      req.params.date as string,
      req.body.entries,
    );
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Dhikr day saved', data });
  }),
};
