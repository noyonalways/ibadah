import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { releaseService } from '@/modules/release/release.service';

export const releaseController = {
  list: catchAsync(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const data = await releaseService.getReleases(page, limit);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Releases',
      data: data.items,
      meta: {
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      },
    });
  }),
};
