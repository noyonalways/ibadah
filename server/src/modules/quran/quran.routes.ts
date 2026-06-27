import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { quranController } from '@/modules/quran/quran.controller';
import {
  getQuranDaySchema,
  quranRangeSchema,
  upsertQuranDaySchema,
} from '@/modules/quran/quran.validation';

export const quranRouter = Router();
quranRouter.use(requireAuth);

quranRouter.get('/', validate(quranRangeSchema), quranController.listRange);
quranRouter.get('/:date', validate(getQuranDaySchema), quranController.getDay);
quranRouter.put('/:date', validate(upsertQuranDaySchema), quranController.upsertDay);
