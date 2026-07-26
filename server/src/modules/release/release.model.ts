import { Schema, model } from 'mongoose';
import type { IReleaseDocument, IReleaseModel } from '@/modules/release/release.interface';

const releaseEntrySchema = new Schema(
  {
    category: {
      type: String,
      enum: ['feature', 'fix', 'enhancement'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    scope: { type: String, trim: true },
  },
  { _id: false },
);

const releaseSchema = new Schema<IReleaseDocument, IReleaseModel>(
  {
    version: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    entries: { type: [releaseEntrySchema], default: [] },
  },
  { timestamps: true, collection: 'releases' },
);

releaseSchema.index({ date: -1 });

export const Release = model<IReleaseDocument, IReleaseModel>('Release', releaseSchema);
