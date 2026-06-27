import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { statsController } from '@/modules/stats/stats.controller';
import { dailyPointsSchema } from '@/modules/stats/stats.validation';

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get('/daily', validate(dailyPointsSchema), statsController.dailyPoints);
statsRouter.get('/streaks', statsController.streaks);
