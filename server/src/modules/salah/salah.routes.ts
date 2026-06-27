import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { salahController } from '@/modules/salah/salah.controller';
import {
  getDaySchema,
  rangeQuerySchema,
  updateJummahSchema,
  updatePrayerSchema,
  upsertDaySchema,
} from '@/modules/salah/salah.validation';

export const salahRouter = Router();

salahRouter.use(requireAuth);

salahRouter.get('/', validate(rangeQuerySchema), salahController.listRange);
salahRouter.get('/:date', validate(getDaySchema), salahController.getDay);
salahRouter.put('/:date', validate(upsertDaySchema), salahController.upsertDay);
// Friday-only — the service rejects on non-Friday dates.
salahRouter.patch(
  '/:date/jummah',
  validate(updateJummahSchema),
  salahController.updateJummah,
);
salahRouter.patch('/:date/:prayer', validate(updatePrayerSchema), salahController.updatePrayer);
