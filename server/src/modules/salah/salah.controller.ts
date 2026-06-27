import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { salahService } from '@/modules/salah/salah.service';
import type { PrayerName } from '@/modules/salah/salah.constants';

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
}

export const salahController = {
  getDay: catchAsync(async (req, res) => {
    const data = await salahService.getDay(userId(req), req.params.date as string);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Salah day fetched', data });
  }),

  upsertDay: catchAsync(async (req, res) => {
    const data = await salahService.upsertDay(userId(req), req.params.date as string, req.body);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Salah day saved', data });
  }),

  updatePrayer: catchAsync(async (req, res) => {
    const data = await salahService.updatePrayer(
      userId(req),
      req.params.date as string,
      req.params.prayer as PrayerName,
      req.body,
    );
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Prayer updated', data });
  }),

  updateJummah: catchAsync(async (req, res) => {
    const data = await salahService.updateJummah(
      userId(req),
      req.params.date as string,
      req.body,
    );
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Jummah updated', data });
  }),

  listRange: catchAsync(async (req, res) => {
    const { from, to } = req.query as { from: string; to: string };
    const data = await salahService.listRange(userId(req), from, to);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Salah range fetched', data });
  }),
};
