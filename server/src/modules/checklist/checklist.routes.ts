import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { checklistController } from '@/modules/checklist/checklist.controller';
import { getChecklistDaySchema, upsertChecklistDaySchema } from '@/modules/checklist/checklist.validation';

export const checklistRouter = Router();
checklistRouter.use(requireAuth);

checklistRouter.get('/:date', validate(getChecklistDaySchema), checklistController.getDay);
checklistRouter.put('/:date', validate(upsertChecklistDaySchema), checklistController.upsertDay);
