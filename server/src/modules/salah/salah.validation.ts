import { z } from 'zod';
import { PRAYER_NAMES, PRAYER_STATUSES } from './salah.constants.js';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const prayerEntry = z.object({
  status: z.enum(PRAYER_STATUSES).optional(),
  sunnahNafil: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const upsertDaySchema = z.object({
  params: z.object({ date: dateString }),
  body: z.object({
    prayers: z
      .object(
        PRAYER_NAMES.reduce(
          (acc, name) => {
            acc[name] = prayerEntry.optional();
            return acc;
          },
          {} as Record<string, z.ZodOptional<typeof prayerEntry>>,
        ),
      )
      .optional(),
    witr: z.boolean().optional(),
  }),
});

export const updatePrayerSchema = z.object({
  params: z.object({
    date: dateString,
    prayer: z.enum(PRAYER_NAMES),
  }),
  body: prayerEntry,
});

export const getDaySchema = z.object({
  params: z.object({ date: dateString }),
});

export const rangeQuerySchema = z.object({
  query: z.object({
    from: dateString,
    to: dateString,
  }),
});
