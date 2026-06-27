import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { dhikrController } from '@/modules/dhikr/dhikr.controller';
import { getDhikrDaySchema, upsertDhikrDaySchema } from '@/modules/dhikr/dhikr.validation';

export const dhikrRouter = Router();
dhikrRouter.use(requireAuth);

dhikrRouter.get('/presets', dhikrController.getPresets);
dhikrRouter.get('/:date', validate(getDhikrDaySchema), dhikrController.getDay);
dhikrRouter.put('/:date', validate(upsertDhikrDaySchema), dhikrController.upsertDay);
