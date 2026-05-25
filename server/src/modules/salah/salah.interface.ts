import type { Document, Model, Types } from 'mongoose';
import type { PrayerName, PrayerStatus } from './salah.constants.js';

export interface IPrayerEntry {
  status: PrayerStatus;
  sunnahNafil: boolean;
  notes?: string;
}

export type IPrayers = Record<PrayerName, IPrayerEntry>;

export interface ISalahDay {
  user: Types.ObjectId;
  /** Normalized to UTC midnight for the user's local day. */
  date: Date;
  prayers: IPrayers;
  witr: boolean;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalahDayDocument extends ISalahDay, Document {
  _id: Types.ObjectId;
}

export type ISalahDayModel = Model<ISalahDayDocument>;
