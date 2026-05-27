import { z } from 'zod';

const pointField = z.number().int().min(-100).max(100).optional();

/**
 * Per-user salah scoring overrides. All keys optional, all bounded
 * to ±100 to keep numbers human-meaningful in the UI.
 */
const scoringSchema = z
  .object({
    fardAwwal: pointField,
    fardMid: pointField,
    fardLast: pointField,
    fardLate: pointField,
    fardMissed: pointField,
    sunnahBefore: pointField,
    sunnahAfter: pointField,
    nafl: pointField,
    witr: pointField,
    jummahFard: pointField,
    jummahKhutbah: pointField,
    jummahEarly: pointField,
    jummahSurahKahf: pointField,
    jummahGhusl: pointField,
  })
  .optional();

const checklistTemplateItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  rewardPoints: z.number().int().min(-100).max(100).default(5),
});

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().url().or(z.literal('')).optional(),
    locale: z.enum(['en', 'bn', 'ar']).optional(),
    timezone: z.string().min(1).max(60).optional(),
    scoring: scoringSchema,
    defaultChecklistItems: z.array(checklistTemplateItemSchema).max(50).optional(),
  }),
});
