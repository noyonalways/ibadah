import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { auditService } from '@/modules/audit/audit.service';
import type { ListAuditDto } from '@/modules/audit/audit.validation';

export const auditController = {
  list: catchAsync(async (req, res) => {
    const result = await auditService.list(req.query as ListAuditDto);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Audit log',
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),

  actions: catchAsync(async (_req, res) => {
    const data = await auditService.distinctActions();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Audit action catalog',
      data,
    });
  }),

  summary: catchAsync(async (req, res) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days ?? 30)));
    const data = await auditService.recentSummary(days);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Audit summary',
      data,
    });
  }),
};
