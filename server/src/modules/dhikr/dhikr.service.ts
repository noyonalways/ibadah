import { Types } from 'mongoose';
import { toDayKey } from '@/utils/date';
import { DhikrDay } from '@/modules/dhikr/dhikr.model';
import { DEFAULT_DHIKR_PRESETS } from '@/modules/dhikr/dhikr.constants';
import { defaultsService } from '@/modules/admin/defaults.service';
import type { IDhikrEntry } from '@/modules/dhikr/dhikr.interface';

export const dhikrService = {
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const doc = await DhikrDay.findOne({ user: new Types.ObjectId(userId), date }).lean();
    if (doc) return doc;

    // Fresh day — seed from admin-managed defaults (which themselves fall
    // back to DEFAULT_DHIKR_PRESETS when the admin hasn't customized them).
    // This is purely a read-time helper; the user can edit/remove these
    // and the changes are saved on the next PUT.
    const defaults = await defaultsService.get();
    const seedTemplate = defaults.dhikr.length > 0 ? defaults.dhikr : DEFAULT_DHIKR_PRESETS;
    const seeded: IDhikrEntry[] = seedTemplate.map((p) => ({
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

  async presets() {
    const defaults = await defaultsService.get();
    if (defaults.dhikr.length > 0) return defaults.dhikr;
    return DEFAULT_DHIKR_PRESETS;
  },

  async listRange(userId: string, fromStr: string, toStr: string) {
    const from = toDayKey(fromStr);
    const to = toDayKey(toStr);
    return DhikrDay.find({ user: new Types.ObjectId(userId), date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean();
  },
};
