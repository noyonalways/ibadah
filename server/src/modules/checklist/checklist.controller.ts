import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { checklistService } from '@/modules/checklist/checklist.service';

const userIdOf = (req: { user?: { id: string } }) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const checklistController = {
  getDay: catchAsync(async (req, res) => {
    const data = await checklistService.getDay(userIdOf(req), req.params.date as string);
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Checklist day fetched', data });
  }),
  upsertDay: catchAsync(async (req, res) => {
    const data = await checklistService.upsertDay(
      userIdOf(req),
      req.params.date as string,
      req.body.items,
    );
    sendResponse(res, { statusCode: StatusCodes.OK, message: 'Checklist day saved', data });
  }),
};
