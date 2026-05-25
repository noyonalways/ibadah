import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const entrySchema = z.object({
  slug: z.string().min(1).max(50),
  label: z.string().min(1).max(80),
  arabic: z.string().max(120).optional(),
  target: z.number().int().min(0).max(100000).optional(),
  count: z.number().int().min(0).max(100000).optional(),
});

export const upsertDhikrDaySchema = z.object({
  params: z.object({ date: dateString }),
  body: z.object({
    entries: z.array(entrySchema).max(50),
  }),
});

export const getDhikrDaySchema = z.object({ params: z.object({ date: dateString }) });
