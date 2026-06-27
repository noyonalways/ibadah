import { DEFAULT_DHIKR_PRESETS } from '@/modules/dhikr/dhikr.constants';
import { DefaultsConfig } from '@/modules/admin/defaults.model';
import type {
  IChecklistDefault,
  IDhikrDefault,
  IHabitDefault,
} from '@/modules/admin/defaults.interface';

/**
 * Hard-coded fallbacks used when the DefaultsConfig collection is empty
 * (i.e. on a fresh database before any admin has saved overrides).
 * Mirrors the spirit of the existing dhikr.constants.ts.
 */
const FALLBACK_HABITS: IHabitDefault[] = [
  {
    name: 'Wake before Fajr',
    description: 'Rise early enough to perform Tahajjud or extra remembrance.',
    rewardPoints: 10,
  },
  {
    name: 'Read Quran daily',
    description: 'Even a single page counts.',
    rewardPoints: 8,
  },
  {
    name: 'Daily duʿāʾ for parents',
    rewardPoints: 5,
  },
  {
    name: 'Sleep on time',
    description: 'A rested body worships better.',
    rewardPoints: 5,
  },
];

const FALLBACK_CHECKLIST: IChecklistDefault[] = [
  { title: 'Morning adhkar', rewardPoints: 5 },
  { title: 'Evening adhkar', rewardPoints: 5 },
  { title: 'Charity (any amount)', rewardPoints: 5 },
  { title: 'Family time', rewardPoints: 3 },
];

const FALLBACK_DHIKR: IDhikrDefault[] = DEFAULT_DHIKR_PRESETS.map((p) => ({
  slug: p.slug,
  label: p.label,
  arabic: p.arabic,
  defaultTarget: p.defaultTarget,
}));

export interface DefaultsPayload {
  habits: IHabitDefault[];
  checklist: IChecklistDefault[];
  dhikr: IDhikrDefault[];
}

interface DefaultsResult extends DefaultsPayload {
  updatedBy?: string;
  updatedAt?: Date;
}

export const defaultsService = {
  /**
   * Read the singleton record. If none exists yet (fresh DB) we return
   * the hard-coded fallbacks so consumers always have something to seed
   * new users with.
   */
  async get(): Promise<DefaultsResult> {
    const doc = await DefaultsConfig.findOne({ key: 'global' }).lean();
    if (!doc) {
      return {
        habits: FALLBACK_HABITS,
        checklist: FALLBACK_CHECKLIST,
        dhikr: FALLBACK_DHIKR,
      };
    }
    return {
      habits: doc.habits ?? [],
      checklist: doc.checklist ?? [],
      dhikr: doc.dhikr ?? [],
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt,
    };
  },

  /**
   * Replace the singleton. We never `$push` — the admin always sees
   * and saves the full template list, so set-and-replace is the
   * simplest, race-safest semantics.
   */
  async update(payload: DefaultsPayload, updatedBy?: string): Promise<DefaultsResult> {
    const doc = await DefaultsConfig.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          habits: payload.habits ?? [],
          checklist: payload.checklist ?? [],
          dhikr: payload.dhikr ?? [],
          updatedBy,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return {
      habits: doc.habits ?? [],
      checklist: doc.checklist ?? [],
      dhikr: doc.dhikr ?? [],
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt,
    };
  },
};
