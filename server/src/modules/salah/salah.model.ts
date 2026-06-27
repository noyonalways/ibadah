import { Schema, model } from 'mongoose';
import type { ISalahDayDocument, ISalahDayModel } from '@/modules/salah/salah.interface';
import { PRAYER_NAMES, PRAYER_STATUSES } from '@/modules/salah/salah.constants';

/** Sub-schema for the Fard portion (timing status only). */
const fardSchema = new Schema(
  {
    status: { type: String, enum: PRAYER_STATUSES, default: 'pending' },
  },
  { _id: false },
);

/**
 * Per-waqt entry: the Fard plus three independent boolean flags for
 * optional rakat. `notes` is open-ended user reflection.
 */
const prayerEntrySchema = new Schema(
  {
    fard: { type: fardSchema, default: () => ({ status: 'pending' }) },
    sunnahBefore: { type: Boolean, default: false },
    sunnahAfter: { type: Boolean, default: false },
    nafl: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false },
);

/**
 * Friday Jummah sub-document. Mirrors the prayer-entry shape, plus
 * Jummah-specific flags (Khutbah, early arrival, Surah Al-Kahf, Ghusl).
 */
const jummahSchema = new Schema(
  {
    fard: { type: fardSchema, default: () => ({ status: 'pending' }) },
    sunnahBefore: { type: Boolean, default: false },
    sunnahAfter: { type: Boolean, default: false },
    nafl: { type: Boolean, default: false },
    khutbah: { type: Boolean, default: false },
    earlyArrival: { type: Boolean, default: false },
    surahKahf: { type: Boolean, default: false },
    ghusl: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const defaultPrayers = () =>
  PRAYER_NAMES.reduce(
    (acc, name) => {
      acc[name] = {
        fard: { status: 'pending' },
        sunnahBefore: false,
        sunnahAfter: false,
        nafl: false,
      };
      return acc;
    },
    {} as Record<
      string,
      {
        fard: { status: string };
        sunnahBefore: boolean;
        sunnahAfter: boolean;
        nafl: boolean;
      }
    >,
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
    /**
     * Optional — populated only on Fridays when the user logs Jummah.
     * `strict: false` would let legacy docs round-trip, but we keep
     * `strict: true` and rely on service-level normalization for old
     * pre-redesign documents.
     */
    jummah: { type: jummahSchema, default: undefined },
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
