import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  rewardPoints: z.number().int().min(-100).max(100).default(5),
  completed: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const upsertChecklistDaySchema = z.object({
  params: z.object({ date: dateString }),
  body: z.object({
    items: z.array(itemSchema).max(50),
  }),
});

export const getChecklistDaySchema = z.object({ params: z.object({ date: dateString }) });
