import { Schema, model } from 'mongoose';
import type { IChecklistDayDocument, IChecklistDayModel } from './checklist.interface.js';

const itemSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  rewardPoints: { type: Number, default: 5, min: -100, max: 100 },
  completed: { type: Boolean, default: false },
  notes: { type: String, maxlength: 500 },
});

const checklistDaySchema = new Schema<IChecklistDayDocument, IChecklistDayModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    items: { type: [itemSchema], default: [] },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

checklistDaySchema.index({ user: 1, date: 1 }, { unique: true });

export const ChecklistDay = model<IChecklistDayDocument, IChecklistDayModel>(
  'ChecklistDay',
  checklistDaySchema,
);
