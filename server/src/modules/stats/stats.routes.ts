import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { statsController } from './stats.controller.js';
import { dailyPointsSchema } from './stats.validation.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get('/daily', validate(dailyPointsSchema), statsController.dailyPoints);
statsRouter.get('/streaks', statsController.streaks);
