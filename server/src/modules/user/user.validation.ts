import { z } from 'zod';

const scoringSchema = z
  .object({
    onTimeAwwal: z.number().int().min(-100).max(100).optional(),
    onTimeMid: z.number().int().min(-100).max(100).optional(),
    onTimeLast: z.number().int().min(-100).max(100).optional(),
    missed: z.number().int().min(-100).max(100).optional(),
    sunnahNafil: z.number().int().min(-100).max(100).optional(),
    witr: z.number().int().min(-100).max(100).optional(),
  })
  .optional();

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().url().or(z.literal('')).optional(),
    locale: z.enum(['en', 'bn', 'ar']).optional(),
    timezone: z.string().min(1).max(60).optional(),
    scoring: scoringSchema,
  }),
});
