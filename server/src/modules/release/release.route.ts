import { Router } from 'express';

import { releaseController } from '@/modules/release/release.controller';

export const releaseRouter = Router();

// Public — no auth required. This is a marketing/changelog endpoint.
releaseRouter.get('/', releaseController.list);
