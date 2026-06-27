import type { Document, Model, Types } from 'mongoose';
import type { PrayerName, PrayerStatus } from '@/modules/salah/salah.constants';

/** The Fard portion of a waqt prayer. Has a timing status. */
export interface IFardEntry {
  status: PrayerStatus;
}

/**
 * A complete entry for a regular waqt prayer (Fajr, Dhuhr, Asr, Maghrib,
 * Isha). The user logs the Fard timing plus three independent flags for
 * the optional rakat (Sunnah before, Sunnah after, Nafl). All flags
 * default to false.
 */
export interface IPrayerEntry {
  fard: IFardEntry;
  sunnahBefore: boolean;
  sunnahAfter: boolean;
  nafl: boolean;
  notes?: string;
}

/**
 * Friday Jummah entry. Adds Jummah-specific flags on top of the standard
 * waqt-prayer shape (Khutbah, early arrival, Surah Al-Kahf, Ghusl).
 */
export interface IJummahEntry {
  fard: IFardEntry;
  sunnahBefore: boolean;
  sunnahAfter: boolean;
  nafl: boolean;
  khutbah: boolean;
  earlyArrival: boolean;
  surahKahf: boolean;
  ghusl: boolean;
  notes?: string;
}

export type IPrayers = Record<PrayerName, IPrayerEntry>;

export interface ISalahDay {
  user: Types.ObjectId;
  /** Normalized to UTC midnight for the user's local day. */
  date: Date;
  prayers: IPrayers;
  /**
   * Friday Jummah. Optional — populated only on Fridays when the user
   * has logged something. When present (and the day is a Friday), Dhuhr
   * is excluded from the daily total in favor of these points.
   */
  jummah?: IJummahEntry;
  witr: boolean;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalahDayDocument extends ISalahDay, Document {
  _id: Types.ObjectId;
}

export type ISalahDayModel = Model<ISalahDayDocument>;
