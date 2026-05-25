import { Schema, model } from 'mongoose';
import type { IDhikrDayDocument, IDhikrDayModel } from './dhikr.interface.js';

const dhikrEntrySchema = new Schema(
  {
    slug: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    arabic: { type: String, trim: true },
    target: { type: Number, default: 0, min: 0 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const dhikrDaySchema = new Schema<IDhikrDayDocument, IDhikrDayModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    entries: { type: [dhikrEntrySchema], default: [] },
  },
  { timestamps: true },
);

dhikrDaySchema.index({ user: 1, date: 1 }, { unique: true });

export const DhikrDay = model<IDhikrDayDocument, IDhikrDayModel>('DhikrDay', dhikrDaySchema);
