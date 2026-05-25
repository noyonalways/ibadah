import { Schema, model } from 'mongoose';
import type { ISalahDayDocument, ISalahDayModel } from './salah.interface.js';
import { PRAYER_NAMES, PRAYER_STATUSES } from './salah.constants.js';

const prayerEntrySchema = new Schema(
  {
    status: { type: String, enum: PRAYER_STATUSES, default: 'pending' },
    sunnahNafil: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const defaultPrayers = () =>
  PRAYER_NAMES.reduce(
    (acc, name) => {
      acc[name] = { status: 'pending', sunnahNafil: false };
      return acc;
    },
    {} as Record<string, { status: string; sunnahNafil: boolean }>,
  );

const salahDaySchema = new Schema<ISalahDayDocument, ISalahDayModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    prayers: {
      fajr: { type: prayerEntrySchema, default: () => ({}) },
      dhuhr: { type: prayerEntrySchema, default: () => ({}) },
      asr: { type: prayerEntrySchema, default: () => ({}) },
      maghrib: { type: prayerEntrySchema, default: () => ({}) },
      isha: { type: prayerEntrySchema, default: () => ({}) },
    },
    witr: { type: Boolean, default: false },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true, minimize: false },
);

// One document per user per day
salahDaySchema.index({ user: 1, date: 1 }, { unique: true });

salahDaySchema.pre('save', function (next) {
  if (!this.prayers || Object.keys(this.prayers).length === 0) {
    this.prayers = defaultPrayers() as ISalahDayDocument['prayers'];
  }
  next();
});

export const SalahDay = model<ISalahDayDocument, ISalahDayModel>('SalahDay', salahDaySchema);
