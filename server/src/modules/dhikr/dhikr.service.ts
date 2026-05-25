import { Types } from 'mongoose';
import { toDayKey } from '../../utils/date.js';
import { DhikrDay } from './dhikr.model.js';
import { DEFAULT_DHIKR_PRESETS } from './dhikr.constants.js';
import type { IDhikrEntry } from './dhikr.interface.js';

export const dhikrService = {
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const doc = await DhikrDay.findOne({ user: new Types.ObjectId(userId), date }).lean();
    if (doc) return doc;

    // Default seed for a fresh day
    const seeded: IDhikrEntry[] = DEFAULT_DHIKR_PRESETS.map((p) => ({
      slug: p.slug,
      label: p.label,
      arabic: p.arabic,
      target: p.defaultTarget,
      count: 0,
    }));
    return { date: dateStr, entries: seeded };
  },

  async upsertDay(userId: string, dateStr: string, entries: IDhikrEntry[]) {
    const date = toDayKey(dateStr);
    return DhikrDay.findOneAndUpdate(
      { user: new Types.ObjectId(userId), date },
      { $set: { entries } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },

  presets() {
    return DEFAULT_DHIKR_PRESETS;
  },
};
