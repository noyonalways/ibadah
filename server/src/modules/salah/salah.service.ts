import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ApiError } from '@/utils/ApiError';
import { toDayKey } from '@/utils/date';
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

async function getScoring(userId: string): Promise<SalahScoring> {
  const user = await User.findById(userId).select('scoring').lean();
  return { ...SALAH_DEFAULT_POINTS, ...(user?.scoring ?? {}) };
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
    const doc = await SalahDay.findOne({ user: new Types.ObjectId(userId), date });
    if (!doc) {
      // Virtual empty day so the UI can render consistently without first
      // requiring a write.
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
    const scoring = await getScoring(userId);

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
    const docs = await SalahDay.find({
      user: new Types.ObjectId(userId),
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();

    return docs.map((d) => {
      const dayKey = d.date.toISOString().slice(0, 10);
      return {
        date: dayKey,
        isFriday: isFridayDayKey(dayKey),
        prayers: normalizePrayers(d.prayers),
        jummah: normalizeJummah(d.jummah),
        witr: d.witr,
        totalPoints: d.totalPoints,
      };
    });
  },
};
