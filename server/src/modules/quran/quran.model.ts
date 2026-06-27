import { Schema, model } from 'mongoose';
import type { IQuranDayDocument, IQuranDayModel } from '@/modules/quran/quran.interface';

const quranDaySchema = new Schema<IQuranDayDocument, IQuranDayModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    pagesRead: { type: Number, default: 0, min: 0 },
    minutesRead: { type: Number, default: 0, min: 0 },
    surahFrom: { type: Number, min: 1, max: 114 },
    ayahFrom: { type: Number, min: 1 },
    surahTo: { type: Number, min: 1, max: 114 },
    ayahTo: { type: Number, min: 1 },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true, collection: 'quran_days' },
);

quranDaySchema.index({ user: 1, date: 1 }, { unique: true });

export const QuranDay = model<IQuranDayDocument, IQuranDayModel>('Quran_Day', quranDaySchema);
