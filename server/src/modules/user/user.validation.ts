import { z } from 'zod';

const pointField = z.number().int().min(-100).max(100).optional();

/**
 * Avatar value — accepts:
 *   - empty string (clear)
 *   - http(s) URL (external avatar)
 *   - data:image/{png|jpeg|jpg|webp|gif};base64,... (uploaded by the client,
 *     resized & compressed in the browser)
 *
 * Capped at ~600 KB of payload so a Mongo user document stays small. The
 * client compresses to ~30–50 KB typical, so this is a generous ceiling.
 */
const dataUrlPattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const avatarUrlSchema = z
  .union([
    z.literal(''),
    z.string().url(),
    z.string().regex(dataUrlPattern, 'Avatar must be a valid data URL'),
  ])
  .refine((v) => v.length <= 600_000, 'Avatar exceeds the 600 KB limit')
  .optional();

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
    avatarUrl: avatarUrlSchema,
    locale: z.enum(['en', 'bn', 'ar']).optional(),
    timezone: z.string().min(1).max(60).optional(),
    scoring: scoringSchema,
    defaultChecklistItems: z.array(checklistTemplateItemSchema).max(50).optional(),
  }),
});
