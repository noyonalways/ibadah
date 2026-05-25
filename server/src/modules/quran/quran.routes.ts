import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { quranController } from './quran.controller.js';
import {
  getQuranDaySchema,
  quranRangeSchema,
  upsertQuranDaySchema,
} from './quran.validation.js';

export const quranRouter = Router();
quranRouter.use(requireAuth);

quranRouter.get('/', validate(quranRangeSchema), quranController.listRange);
quranRouter.get('/:date', validate(getQuranDaySchema), quranController.getDay);
quranRouter.put('/:date', validate(upsertQuranDaySchema), quranController.upsertDay);
