import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { ApiError } from '@/utils/ApiError';
import { moderationService } from '@/modules/moderation/moderation.service';
import { auditService } from '@/modules/audit/audit.service';
import type {
  DecideDto,
  FlagManualDto,
  ListModerationDto,
} from '@/modules/moderation/moderation.validation';

const actorOf = (req: { user?: { id: string } }): string => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  return req.user.id;
};

export const moderationController = {
  list: catchAsync(async (req, res) => {
    const result = await moderationService.listFlags(req.query as ListModerationDto);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Moderation queue',
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        counts: result.counts,
        byType: result.byType,
      },
    });
  }),

  overview: catchAsync(async (_req, res) => {
    const data = await moderationService.overview();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Moderation overview',
      data,
    });
  }),

  scan: catchAsync(async (req, res) => {
    const data = await moderationService.runScan();
    void auditService.recordFromRequest(req, {
      actorId: actorOf(req),
      action: 'moderation.approve',
      reason: `Scan: ${data.flagged.created} new, ${data.flagged.updated} refreshed`,
      context: { kind: 'scan', ...data },
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Moderation scan complete',
      data,
    });
  }),

  flag: catchAsync(async (req, res) => {
    const body = req.body as FlagManualDto;
    const data = await moderationService.flagManually({
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
      actorId: actorOf(req),
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: 'Flag recorded',
      data,
    });
  }),

  decide: catchAsync(async (req, res) => {
    const body = req.body as DecideDto;
    const flagId = req.params.id as string;
    const data = await moderationService.decide(
      flagId,
      body.decision,
      actorOf(req),
      body.note,
    );
    void auditService.recordFromRequest(req, {
      actorId: actorOf(req),
      action:
        body.decision === 'approve'
          ? 'moderation.approve'
          : body.decision === 'hide'
            ? 'moderation.hide'
            : body.decision === 'unhide'
              ? 'moderation.unhide'
              : 'moderation.remove',
      target: {
        type: data.targetType,
        id: data.targetId,
        label: data.contentSnapshot,
      },
      reason: body.note,
      context: { flagId },
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Decision recorded',
      data,
    });
  }),
};
