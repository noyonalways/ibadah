import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { habitController } from './habit.controller.js';
import {
  createHabitSchema,
  getHabitDaySchema,
  idParamSchema,
  updateHabitSchema,
  upsertHabitDaySchema,
} from './habit.validation.js';

export const habitRouter = Router();
habitRouter.use(requireAuth);

// Habit definitions
habitRouter.get('/', habitController.list);
habitRouter.post('/', validate(createHabitSchema), habitController.create);
habitRouter.patch('/:id', validate(updateHabitSchema), habitController.update);
habitRouter.delete('/:id', validate(idParamSchema), habitController.remove);

// Daily completion logs
habitRouter.get('/days/:date', validate(getHabitDaySchema), habitController.getDay);
habitRouter.put('/days/:date', validate(upsertHabitDaySchema), habitController.upsertDay);
