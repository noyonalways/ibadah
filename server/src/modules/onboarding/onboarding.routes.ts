import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { optionalAuth, requireAdmin, requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { onboardingController } from '@/modules/onboarding/onboarding.controller';
import {
  listOnboardingSchema,
  onboardingSummarySchema,
  submitOnboardingSchema,
} from '@/modules/onboarding/onboarding.validation';

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many onboarding submissions. Please try again later.',
  },
});

export const clientOnboardingRouter = Router();
clientOnboardingRouter.post(
  '/submissions',
  submitLimiter,
  optionalAuth,
  validate(submitOnboardingSchema),
  onboardingController.submit,
);

export const adminOnboardingRouter = Router();
adminOnboardingRouter.use(requireAuth, requireAdmin);
adminOnboardingRouter.get(
  '/submissions',
  validate(listOnboardingSchema),
  onboardingController.list,
);
adminOnboardingRouter.get(
  '/summary',
  validate(onboardingSummarySchema),
  onboardingController.summary,
);
