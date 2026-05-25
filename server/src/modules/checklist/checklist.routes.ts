import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { checklistController } from './checklist.controller.js';
import { getChecklistDaySchema, upsertChecklistDaySchema } from './checklist.validation.js';

export const checklistRouter = Router();
checklistRouter.use(requireAuth);

checklistRouter.get('/:date', validate(getChecklistDaySchema), checklistController.getDay);
checklistRouter.put('/:date', validate(upsertChecklistDaySchema), checklistController.upsertDay);
