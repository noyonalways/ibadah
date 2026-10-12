import { Router } from 'express';

import { requireAdmin, requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { siteConfigController } from '@/modules/site-config/site-config.controller';
import { updateRecruiterIntroSchema } from '@/modules/site-config/site-config.validation';

/** Public, no auth. Read by the marketing site on every visit. */
export const publicSiteConfigRouter = Router();
publicSiteConfigRouter.get('/public', siteConfigController.getPublic);

/** Admin only. */
export const adminSiteConfigRouter = Router();
adminSiteConfigRouter.use(requireAuth, requireAdmin);
adminSiteConfigRouter.get('/', siteConfigController.get);
adminSiteConfigRouter.patch(
  '/recruiter-intro',
  validate(updateRecruiterIntroSchema),
  siteConfigController.updateRecruiterIntro,
);
