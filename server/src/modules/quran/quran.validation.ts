import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const upsertQuranDaySchema = z.object({
  params: z.object({ date: dateString }),
  body: z.object({
    pagesRead: z.number().int().min(0).max(1000).optional(),
    minutesRead: z.number().int().min(0).max(1440).optional(),
    surahFrom: z.number().int().min(1).max(114).optional(),
    ayahFrom: z.number().int().min(1).optional(),
    surahTo: z.number().int().min(1).max(114).optional(),
    ayahTo: z.number().int().min(1).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const getQuranDaySchema = z.object({ params: z.object({ date: dateString }) });

export const quranRangeSchema = z.object({
  query: z.object({ from: dateString, to: dateString }),
});
