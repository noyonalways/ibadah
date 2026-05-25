import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { salahController } from './salah.controller.js';
import {
  getDaySchema,
  rangeQuerySchema,
  updatePrayerSchema,
  upsertDaySchema,
} from './salah.validation.js';

export const salahRouter = Router();

salahRouter.use(requireAuth);

salahRouter.get('/', validate(rangeQuerySchema), salahController.listRange);
salahRouter.get('/:date', validate(getDaySchema), salahController.getDay);
salahRouter.put('/:date', validate(upsertDaySchema), salahController.upsertDay);
salahRouter.patch('/:date/:prayer', validate(updatePrayerSchema), salahController.updatePrayer);
