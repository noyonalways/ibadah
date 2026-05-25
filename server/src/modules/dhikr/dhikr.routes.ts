import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { dhikrController } from './dhikr.controller.js';
import { getDhikrDaySchema, upsertDhikrDaySchema } from './dhikr.validation.js';

export const dhikrRouter = Router();
dhikrRouter.use(requireAuth);

dhikrRouter.get('/presets', dhikrController.getPresets);
dhikrRouter.get('/:date', validate(getDhikrDaySchema), dhikrController.getDay);
dhikrRouter.put('/:date', validate(upsertDhikrDaySchema), dhikrController.upsertDay);
