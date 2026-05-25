import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'invalid id');

export const createHabitSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80),
    description: z.string().max(500).optional(),
    rewardPoints: z.number().int().min(-100).max(100).default(5),
    color: z.string().max(20).optional(),
    icon: z.string().max(40).optional(),
  }),
});

export const updateHabitSchema = z.object({
  params: z.object({ id: objectId }),
  body: createHabitSchema.shape.body.partial().extend({
    archived: z.boolean().optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: objectId }) });

export const upsertHabitDaySchema = z.object({
  params: z.object({ date: dateString }),
  body: z.object({
    entries: z.array(z.object({ habit: objectId, completed: z.boolean() })).max(100),
  }),
});

export const getHabitDaySchema = z.object({ params: z.object({ date: dateString }) });
