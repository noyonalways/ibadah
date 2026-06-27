import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { habitController } from '@/modules/habit/habit.controller';
import {
  createHabitSchema,
  getHabitDaySchema,
  idParamSchema,
  updateHabitSchema,
  upsertHabitDaySchema,
} from '@/modules/habit/habit.validation';

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
