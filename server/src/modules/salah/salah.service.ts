import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ApiError } from '@/utils/ApiError';
import { formatDayKey, localDayKey, toDayKey } from '@/utils/date';
import { logger } from '@/utils/logger';
import { User } from '@/modules/user/user.model';
import {
  SALAH_DEFAULT_POINTS,
  PRAYER_NAMES,
  PRAYER_SUNNAH_RAKAH,
  JUMMAH_SUNNAH_RAKAH,
  isFridayDayKey,
  type PrayerName,
  type PrayerStatus,
  type SalahScoring,
} from '@/modules/salah/salah.constants';
import { SalahDay } from '@/modules/salah/salah.model';
import type {
  IJummahEntry,
  IPrayerEntry,
  IPrayers,
  ISalahDayDocument,
} from '@/modules/salah/salah.interface';

/**
 * The two per-user settings the salah engine needs together: the merged
 * scoring config and the IANA timezone used to decide when a day has ended.
 */
async function getUserSettings(
  userId: string,
): Promise<{ scoring: SalahScoring; timezone: string }> {
  const user = await User.findById(userId).select('scoring timezone').lean();
  return {
    scoring: { ...SALAH_DEFAULT_POINTS, ...(user?.scoring ?? {}) },
    timezone: user?.timezone ?? 'UTC',
  };
}

/* ------------------------------------------------------------------ *
 * Legacy-compat normalization                                         *
 * ------------------------------------------------------------------ */

/**
 * Pre-redesign documents stored prayer entries as
 *   `{ status, sunnahNafil, notes }`
 * This lifts any such document into the new shape:
 *   `{ fard: { status }, sunnahBefore, sunnahAfter, nafl, notes }`
 * The mapping interprets the legacy `sunnahNafil` boolean as a
 * post-fard sunnah (the most commonly tracked rakat in that single
 * historical flag). Calling this on a doc that's already in the new
 * shape is a no-op.
 */
function normalizePrayerEntry(raw: unknown): IPrayerEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  const fard = (r.fard ?? null) as { status?: PrayerStatus } | null;

  if (fard && typeof fard === 'object' && 'status' in fard) {
    return {
      fard: { status: (fard.status as PrayerStatus | undefined) ?? 'pending' },
      sunnahBefore: !!r.sunnahBefore,
      sunnahAfter: !!r.sunnahAfter,
      nafl: !!r.nafl,
      notes: typeof r.notes === 'string' ? (r.notes as string) : undefined,
    };
  }

  // Legacy shape: status at the entry root, single sunnahNafil flag.
  return {
    fard: { status: (r.status as PrayerStatus | undefined) ?? 'pending' },
    sunnahBefore: false,
    sunnahAfter: !!r.sunnahNafil,
    nafl: false,
    notes: typeof r.notes === 'string' ? (r.notes as string) : undefined,
  };
}

function normalizeJummah(raw: unknown): IJummahEntry | undefined {
  if (!raw) return undefined;
  const base = normalizePrayerEntry(raw);
  const r = raw as Record<string, unknown>;
  return {
    ...base,
    khutbah: !!r.khutbah,
    earlyArrival: !!r.earlyArrival,
    surahKahf: !!r.surahKahf,
    ghusl: !!r.ghusl,
  };
}

function normalizePrayers(prayers: unknown): IPrayers {
  const p = (prayers ?? {}) as Record<string, unknown>;
  return PRAYER_NAMES.reduce((acc, name) => {
    acc[name] = normalizePrayerEntry(p[name]);
    return acc;
  }, {} as IPrayers);
}

/* ------------------------------------------------------------------ *
 * Scoring                                                             *
 * ------------------------------------------------------------------ */

function pointsForFardStatus(
  status: PrayerStatus,
  scoring: SalahScoring,
  /** When `true`, use the Jummah-Fard reward instead of the regular Fard. */
  isJummah = false,
): number {
  switch (status) {
    case 'on_time_awwal':
      return isJummah ? scoring.jummahFard : scoring.fardAwwal;
    case 'on_time_mid':
      // For Jummah, the only "performed" timing is "with the Imam".
      // We still grant the full Jummah Fard reward at any on-time bucket
      // to keep the UI honest — the user signals "I prayed Jummah", and
      // the server doesn't second-guess which third of the window.
      return isJummah ? scoring.jummahFard : scoring.fardMid;
    case 'on_time_last':
      return isJummah ? scoring.jummahFard : scoring.fardLast;
    case 'late':
      return scoring.fardLate;
    case 'missed':
      return scoring.fardMissed;
    case 'pending':
    default:
      return 0;
  }
}

function pointsForPrayer(
  prayer: PrayerName,
  entry: IPrayerEntry,
  scoring: SalahScoring,
): number {
  const rakah = PRAYER_SUNNAH_RAKAH[prayer];
  let pts = pointsForFardStatus(entry.fard.status, scoring, false);
  // Per-rakah credit, gated on whether this prayer actually has the
  // sunnah at all. A toggle on a 0-rakah sunnah contributes nothing
  // (we tolerate stray legacy data here rather than reject it).
  if (entry.sunnahBefore && rakah.before > 0) {
    pts += scoring.sunnahBefore * rakah.before;
  }
  if (entry.sunnahAfter && rakah.after > 0) {
    pts += scoring.sunnahAfter * rakah.after;
  }
  if (entry.nafl) pts += scoring.nafl;
  return pts;
}

function pointsForJummah(entry: IJummahEntry, scoring: SalahScoring): number {
  let pts = pointsForFardStatus(entry.fard.status, scoring, true);
  if (entry.sunnahBefore) {
    pts += scoring.sunnahBefore * JUMMAH_SUNNAH_RAKAH.before;
  }
  if (entry.sunnahAfter) {
    pts += scoring.sunnahAfter * JUMMAH_SUNNAH_RAKAH.after;
  }
  if (entry.nafl) pts += scoring.nafl;
  if (entry.khutbah) pts += scoring.jummahKhutbah;
  if (entry.earlyArrival) pts += scoring.jummahEarly;
  if (entry.surahKahf) pts += scoring.jummahSurahKahf;
  if (entry.ghusl) pts += scoring.jummahGhusl;
  return pts;
}

/**
 * Was Jummah meaningfully logged? A pristine all-false / pending entry
 * is treated as not logged so we don't double-count the Friday slot.
 */
function isJummahLogged(j: IJummahEntry | undefined): boolean {
  if (!j) return false;
  if (j.fard.status !== 'pending') return true;
  return (
    j.sunnahBefore ||
    j.sunnahAfter ||
    j.nafl ||
    j.khutbah ||
    j.earlyArrival ||
    j.surahKahf ||
    j.ghusl
  );
}

function calculateTotal(
  prayers: IPrayers,
  jummah: IJummahEntry | undefined,
  witr: boolean,
  scoring: SalahScoring,
  isFriday: boolean,
): number {
  let total = 0;
  const skipDhuhr = isFriday && isJummahLogged(jummah);

  for (const name of PRAYER_NAMES) {
    if (name === 'dhuhr' && skipDhuhr) continue;
    total += pointsForPrayer(name, prayers[name], scoring);
  }
  if (isFriday && jummah && isJummahLogged(jummah)) {
    total += pointsForJummah(jummah, scoring);
  }
  if (witr) total += scoring.witr;
  return total;
}

/* ------------------------------------------------------------------ *
 * Auto-miss settling                                                  *
 * ------------------------------------------------------------------ *
 * Requirement: once a day has ended (in the user's own timezone), any
 * waqt Fard the user never interacted with — i.e. still `pending` — is
 * recorded as `missed`. This makes a user's missed-prayer history
 * accurate automatically, without forcing them to tap "missed" on every
 * skipped prayer.
 *
 * Scope: we only ever settle days that ALREADY have a document (the user
 * engaged with the day at least once). We never fabricate documents for
 * days the app was never opened. `today` (and the future) is never
 * touched — the user can still log a prayer any time before midnight.
 */

/**
 * Flip every `pending` waqt Fard to `missed`, in place. On Fridays where a
 * Jummah was logged, Dhuhr is left untouched: Jummah replaces Dhuhr for the
 * Friday midday obligation (and Dhuhr is excluded from scoring), so we must
 * not also stamp it `missed`. Returns `true` if anything changed.
 */
function applyMissed(
  prayers: IPrayers,
  isFriday: boolean,
  jummah: IJummahEntry | undefined,
): boolean {
  const skipDhuhr = isFriday && isJummahLogged(jummah);
  let changed = false;
  for (const name of PRAYER_NAMES) {
    if (name === 'dhuhr' && skipDhuhr) continue;
    if (prayers[name].fard.status === 'pending') {
      prayers[name] = {
        ...prayers[name],
        fard: { ...prayers[name].fard, status: 'missed' },
      };
      changed = true;
    }
  }
  return changed;
}

/**
 * Settle a single (already-ended) day. Reads a raw day document, marks any
 * pending Fard as missed and recomputes the daily total. Returns the new
 * `prayers`/`totalPoints` to persist, or `null` when nothing changed (so the
 * caller can skip a write — the operation is idempotent).
 *
 * The caller is responsible for only invoking this on days that have ended
 * for the user; this function does not re-check the date beyond Friday logic.
 */
function settleEndedDay(
  raw: { prayers: unknown; jummah?: unknown; witr?: boolean; date: Date },
  scoring: SalahScoring,
): { prayers: IPrayers; totalPoints: number } | null {
  const dayKey = formatDayKey(raw.date);
  const isFriday = isFridayDayKey(dayKey);
  const prayers = normalizePrayers(raw.prayers);
  const jummah = normalizeJummah(raw.jummah);

  if (!applyMissed(prayers, isFriday, jummah)) return null;

  const totalPoints = calculateTotal(
    prayers,
    jummah,
    !!raw.witr,
    scoring,
    isFriday,
  );
  return { prayers, totalPoints };
}

function emptyPrayer(): IPrayerEntry {
  return {
    fard: { status: 'pending' },
    sunnahBefore: false,
    sunnahAfter: false,
    nafl: false,
  };
}

function emptyDay(): IPrayers {
  return PRAYER_NAMES.reduce((acc, name) => {
    acc[name] = emptyPrayer();
    return acc;
  }, {} as IPrayers);
}

function emptyJummah(): IJummahEntry {
  return {
    ...emptyPrayer(),
    khutbah: false,
    earlyArrival: false,
    surahKahf: false,
    ghusl: false,
  };
}

/* ------------------------------------------------------------------ *
 * Serialization                                                       *
 * ------------------------------------------------------------------ */

function serialize(doc: ISalahDayDocument, dayKey: string) {
  return {
    id: doc._id.toString(),
    date: dayKey,
    isFriday: isFridayDayKey(dayKey),
    prayers: normalizePrayers(doc.prayers),
    jummah: normalizeJummah(doc.jummah),
    witr: doc.witr,
    totalPoints: doc.totalPoints,
  };
}

/* ------------------------------------------------------------------ *
 * Public API                                                          *
 * ------------------------------------------------------------------ */

export const salahService = {
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const isFriday = isFridayDayKey(dateStr);
    const { scoring, timezone } = await getUserSettings(userId);
    const todayKey = localDayKey(timezone);
    const isEnded = dateStr < todayKey;

    const doc = await SalahDay.findOne({ user: new Types.ObjectId(userId), date });

    if (!doc) {
      if (isEnded) {
        const prayers = emptyDay();
        applyMissed(prayers, isFriday, undefined);
        const totalPoints = calculateTotal(prayers, undefined, false, scoring, isFriday);

        const created = await SalahDay.findOneAndUpdate(
          { user: new Types.ObjectId(userId), date },
          { $setOnInsert: { prayers, witr: false, totalPoints } },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        return serialize(created, dateStr);
      }

      return {
        id: null,
        date: dateStr,
        isFriday,
        prayers: emptyDay(),
        jummah: undefined,
        witr: false,
        totalPoints: 0,
      };
    }

    if (isEnded) {
      const settled = settleEndedDay(doc, scoring);
      if (settled) {
        await SalahDay.updateOne(
          { _id: doc._id },
          { $set: { prayers: settled.prayers, totalPoints: settled.totalPoints } },
        );
        return {
          id: doc._id.toString(),
          date: dateStr,
          isFriday,
          prayers: settled.prayers,
          jummah: normalizeJummah(doc.jummah),
          witr: doc.witr,
          totalPoints: settled.totalPoints,
        };
      }
    }

    return serialize(doc, dateStr);
  },

  async upsertDay(
    userId: string,
    dateStr: string,
    payload: {
      prayers?: Partial<IPrayers>;
      jummah?: Partial<IJummahEntry>;
      witr?: boolean;
    },
  ) {
    const date = toDayKey(dateStr);
    const isFriday = isFridayDayKey(dateStr);
    const { scoring, timezone } = await getUserSettings(userId);

    const existing = await SalahDay.findOne({ user: new Types.ObjectId(userId), date });

    // Always normalize before merging — this transparently lifts legacy
    // pre-redesign documents into the new shape.
    const prayers: IPrayers = existing
      ? normalizePrayers(existing.prayers)
      : emptyDay();

    if (payload.prayers) {
      for (const name of PRAYER_NAMES) {
        const incoming = payload.prayers[name];
        if (!incoming) continue;
        const current = prayers[name];
        prayers[name] = {
          ...current,
          ...incoming,
          // Deep-merge the nested fard subdoc so a partial update of timing
          // doesn't wipe sunnah/nafl flags (and vice-versa).
          fard: { ...current.fard, ...(incoming.fard ?? {}) },
        };
      }
    }

    let jummah: IJummahEntry | undefined =
      normalizeJummah(existing?.jummah) ?? undefined;

    if (payload.jummah && isFriday) {
      const base = jummah ?? emptyJummah();
      jummah = {
        ...base,
        ...payload.jummah,
        fard: { ...base.fard, ...(payload.jummah.fard ?? {}) },
      };
    } else if (payload.jummah && !isFriday) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Jummah can only be logged on Fridays',
      );
    }

    const witr = payload.witr ?? existing?.witr ?? false;

    // If the user is editing a day that has already ended in their timezone,
    // any prayer left untouched (still `pending`) is recorded as `missed` —
    // a day in the past can never legitimately hold a pending prayer.
    if (dateStr < localDayKey(timezone)) {
      applyMissed(prayers, isFriday, jummah);
    }

    const totalPoints = calculateTotal(prayers, jummah, witr, scoring, isFriday);

    const doc = await SalahDay.findOneAndUpdate(
      { user: new Types.ObjectId(userId), date },
      {
        $set: {
          prayers,
          witr,
          totalPoints,
          ...(jummah && isFriday ? { jummah } : {}),
        },
        // Drop a stale jummah field if a non-Friday upsert sneaks in.
        ...(isFriday ? {} : { $unset: { jummah: 1 } }),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return serialize(doc!, dateStr);
  },

  async updatePrayer(
    userId: string,
    dateStr: string,
    prayer: PrayerName,
    entry: Partial<IPrayerEntry>,
  ) {
    return this.upsertDay(userId, dateStr, {
      prayers: { [prayer]: entry } as Partial<IPrayers>,
    });
  },

  async updateJummah(
    userId: string,
    dateStr: string,
    entry: Partial<IJummahEntry>,
  ) {
    if (!isFridayDayKey(dateStr)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Jummah can only be logged on Fridays',
      );
    }
    return this.upsertDay(userId, dateStr, { jummah: entry });
  },

  async listRange(userId: string, fromStr: string, toStr: string) {
    const from = toDayKey(fromStr);
    const to = toDayKey(toStr);
    if (from > to) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '`from` must be on or before `to`');
    }
    const { scoring, timezone } = await getUserSettings(userId);
    const todayKey = localDayKey(timezone);

    const docs = await SalahDay.find({
      user: new Types.ObjectId(userId),
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();

    const existingMap = new Map<string, (typeof docs)[0]>();
    for (const d of docs) {
      const dayKey = d.date.toISOString().slice(0, 10);
      existingMap.set(dayKey, d);
    }

    const ops: Parameters<typeof SalahDay.bulkWrite>[0] = [];
    const result = [];

    const curr = new Date(from.getTime());
    while (curr <= to) {
      const dayKey = formatDayKey(curr);
      const isFriday = isFridayDayKey(dayKey);
      const isEnded = dayKey < todayKey;

      if (existingMap.has(dayKey)) {
        const d = existingMap.get(dayKey)!;
        let prayers = normalizePrayers(d.prayers);
        let totalPoints = d.totalPoints;

        if (isEnded) {
          const settled = settleEndedDay(d, scoring);
          if (settled) {
            prayers = settled.prayers;
            totalPoints = settled.totalPoints;
            ops.push({
              updateOne: {
                filter: { _id: d._id },
                update: { $set: { prayers: settled.prayers, totalPoints } },
              },
            });
          }
        }

        result.push({
          date: dayKey,
          isFriday,
          prayers,
          jummah: normalizeJummah(d.jummah),
          witr: d.witr,
          totalPoints,
        });
      } else {
        if (isEnded) {
          const prayers = emptyDay();
          applyMissed(prayers, isFriday, undefined);
          const totalPoints = calculateTotal(prayers, undefined, false, scoring, isFriday);

          ops.push({
            updateOne: {
              filter: { user: new Types.ObjectId(userId), date: toDayKey(dayKey) },
              update: { $setOnInsert: { prayers, witr: false, totalPoints } },
              upsert: true,
            },
          });

          result.push({
            date: dayKey,
            isFriday,
            prayers,
            jummah: undefined,
            witr: false,
            totalPoints,
          });
        } else {
          result.push({
            date: dayKey,
            isFriday,
            prayers: emptyDay(),
            jummah: undefined,
            witr: false,
            totalPoints: 0,
          });
        }
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (ops.length > 0) {
      await SalahDay.bulkWrite(ops);
    }

    return result;
  },

  /**
   * Scheduled sweep: settle every ended day for every user. Driven by the
   * cron job (and the manual backfill script). Idempotent — touches both
   * existing documents with pending prayers and missing unlogged past days.
   * Returns the number of day documents updated or created.
   */
  async settleAllEndedDays(): Promise<number> {
    const cursor = User.find({})
      .select('_id timezone scoring createdAt')
      .lean()
      .cursor();

    let updated = 0;

    for await (const user of cursor) {
      const scoring: SalahScoring = {
        ...SALAH_DEFAULT_POINTS,
        ...(user.scoring ?? {}),
      };

      const todayKey = localDayKey(user.timezone);
      const cutoff = toDayKey(todayKey);

      // Determine starting date from user creation date (or default to today if not present)
      const userStartStr = (user as unknown as { createdAt?: Date }).createdAt
        ? localDayKey(user.timezone, (user as unknown as { createdAt?: Date }).createdAt)
        : todayKey;

      if (userStartStr >= todayKey) continue;

      let startDate = toDayKey(userStartStr);
      // Cap maximum past lookback to 90 days
      const minDate = new Date(cutoff.getTime() - 90 * 24 * 60 * 60 * 1000);
      if (startDate < minDate) {
        startDate = minDate;
      }

      const endDate = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000);
      if (startDate > endDate) continue;

      const docs = await SalahDay.find({
        user: user._id,
        date: { $gte: startDate, $lte: endDate },
      }).lean();

      const existingMap = new Map<string, (typeof docs)[0]>();
      for (const d of docs) {
        existingMap.set(formatDayKey(d.date), d);
      }

      const ops: Parameters<typeof SalahDay.bulkWrite>[0] = [];
      const curr = new Date(startDate.getTime());

      while (curr <= endDate) {
        const dayKeyStr = formatDayKey(curr);
        const isFriday = isFridayDayKey(dayKeyStr);

        if (existingMap.has(dayKeyStr)) {
          const doc = existingMap.get(dayKeyStr)!;
          const settled = settleEndedDay(doc, scoring);
          if (settled) {
            ops.push({
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $set: {
                    prayers: settled.prayers,
                    totalPoints: settled.totalPoints,
                  },
                },
              },
            });
          }
        } else {
          const prayers = emptyDay();
          applyMissed(prayers, isFriday, undefined);
          const totalPoints = calculateTotal(prayers, undefined, false, scoring, isFriday);

          ops.push({
            updateOne: {
              filter: { user: user._id, date: toDayKey(dayKeyStr) },
              update: {
                $setOnInsert: {
                  prayers,
                  witr: false,
                  totalPoints,
                },
              },
              upsert: true,
            },
          });
        }

        curr.setUTCDate(curr.getUTCDate() + 1);
      }

      if (ops.length > 0) {
        await SalahDay.bulkWrite(ops);
        updated += ops.length;
      }
    }

    if (updated > 0) {
      logger.info(`Salah auto-miss sweep settled ${updated} ended day(s)`);
    }
    return updated;
  },
};
