import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ApiError } from '../../utils/ApiError.js';
import { toDayKey } from '../../utils/date.js';
import { User } from '../user/user.model.js';
import { SALAH_DEFAULT_POINTS, PRAYER_NAMES, type PrayerName } from './salah.constants.js';
import { SalahDay } from './salah.model.js';
import type { IPrayerEntry, IPrayers, ISalahDayDocument } from './salah.interface.js';

type ScoringConfig = typeof SALAH_DEFAULT_POINTS;

async function getScoring(userId: string): Promise<ScoringConfig> {
  const user = await User.findById(userId).select('scoring').lean();
  return { ...SALAH_DEFAULT_POINTS, ...(user?.scoring ?? {}) };
}

function pointsForEntry(entry: IPrayerEntry, scoring: ScoringConfig): number {
  let pts = 0;
  switch (entry.status) {
    case 'on_time_awwal':
      pts += scoring.onTimeAwwal;
      break;
    case 'on_time_mid':
      pts += scoring.onTimeMid;
      break;
    case 'on_time_last':
      pts += scoring.onTimeLast;
      break;
    case 'late':
      pts += scoring.late;
      break;
    case 'missed':
      pts += scoring.missed;
      break;
    case 'pending':
    default:
      break;
  }
  if (entry.sunnahNafil) pts += scoring.sunnahNafil;
  return pts;
}

function calculateTotal(prayers: IPrayers, witr: boolean, scoring: ScoringConfig): number {
  let total = 0;
  for (const name of PRAYER_NAMES) {
    total += pointsForEntry(prayers[name], scoring);
  }
  if (witr) total += scoring.witr;
  return total;
}

function emptyDay(): IPrayers {
  return PRAYER_NAMES.reduce((acc, name) => {
    acc[name] = { status: 'pending', sunnahNafil: false };
    return acc;
  }, {} as IPrayers);
}

function serialize(doc: ISalahDayDocument) {
  return {
    id: doc._id.toString(),
    date: doc.date.toISOString().slice(0, 10),
    prayers: doc.prayers,
    witr: doc.witr,
    totalPoints: doc.totalPoints,
  };
}

export const salahService = {
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const doc = await SalahDay.findOne({ user: new Types.ObjectId(userId), date });
    if (!doc) {
      // Return a virtual empty day so the UI can render consistently.
      return {
        id: null,
        date: dateStr,
        prayers: emptyDay(),
        witr: false,
        totalPoints: 0,
      };
    }
    return serialize(doc);
  },

  async upsertDay(
    userId: string,
    dateStr: string,
    payload: { prayers?: Partial<IPrayers>; witr?: boolean },
  ) {
    const date = toDayKey(dateStr);
    const scoring = await getScoring(userId);

    const existing = await SalahDay.findOne({ user: new Types.ObjectId(userId), date });
    const prayers: IPrayers = existing
      ? (existing.prayers as IPrayers)
      : emptyDay();

    if (payload.prayers) {
      for (const name of PRAYER_NAMES) {
        const incoming = payload.prayers[name];
        if (incoming) prayers[name] = { ...prayers[name], ...incoming };
      }
    }

    const witr = payload.witr ?? existing?.witr ?? false;
    const totalPoints = calculateTotal(prayers, witr, scoring);

    const doc = await SalahDay.findOneAndUpdate(
      { user: new Types.ObjectId(userId), date },
      { $set: { prayers, witr, totalPoints } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return serialize(doc!);
  },

  async updatePrayer(
    userId: string,
    dateStr: string,
    prayer: PrayerName,
    entry: Partial<IPrayerEntry>,
  ) {
    return this.upsertDay(userId, dateStr, { prayers: { [prayer]: entry } as Partial<IPrayers> });
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

    return docs.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      prayers: d.prayers,
      witr: d.witr,
      totalPoints: d.totalPoints,
    }));
  },
};
