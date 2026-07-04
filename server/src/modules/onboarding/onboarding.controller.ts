import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { onboardingService } from '@/modules/onboarding/onboarding.service';
import type {
  ListOnboardingDto,
  OnboardingSummaryDto,
  SubmitOnboardingDto,
} from '@/modules/onboarding/onboarding.validation';

export const onboardingController = {
  submit: catchAsync(async (req, res) => {
    const data = await onboardingService.submit(req, req.body as SubmitOnboardingDto);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: 'Onboarding saved',
      data,
    });
  }),

  list: catchAsync(async (req, res) => {
    const result = await onboardingService.list(req.query as ListOnboardingDto);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Onboarding submissions',
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),

  summary: catchAsync(async (req, res) => {
    const data = await onboardingService.summary(req.query as OnboardingSummaryDto);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Onboarding summary',
      data,
    });
  }),
};
