import { z } from 'zod';
import { PRAYER_NAMES, PRAYER_STATUSES } from '@/modules/salah/salah.constants';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const fardSchema = z
  .object({
    status: z.enum(PRAYER_STATUSES).optional(),
  })
  .optional();

/**
 * Per-waqt entry — all fields optional so the client can PATCH a single
 * toggle without resending the whole document.
 */
const prayerEntry = z.object({
  fard: fardSchema,
  sunnahBefore: z.boolean().optional(),
  sunnahAfter: z.boolean().optional(),
  nafl: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

/** Friday Jummah — same as prayerEntry plus four Friday-only flags. */
const jummahEntry = z.object({
  fard: fardSchema,
  sunnahBefore: z.boolean().optional(),
  sunnahAfter: z.boolean().optional(),
  nafl: z.boolean().optional(),
  khutbah: z.boolean().optional(),
  earlyArrival: z.boolean().optional(),
  surahKahf: z.boolean().optional(),
  ghusl: z.boolean().optional(),
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
    jummah: jummahEntry.optional(),
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

export const updateJummahSchema = z.object({
  params: z.object({ date: dateString }),
  body: jummahEntry,
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
