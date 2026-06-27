import { Schema, model } from 'mongoose';
import type {
  IHabitDayDocument,
  IHabitDayModel,
  IHabitDocument,
  IHabitModel,
} from '@/modules/habit/habit.interface';

const habitSchema = new Schema<IHabitDocument, IHabitModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, maxlength: 500 },
    rewardPoints: { type: Number, default: 5, min: -100, max: 100 },
    color: { type: String, trim: true },
    icon: { type: String, trim: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const habitDayEntrySchema = new Schema(
  {
    habit: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const habitDaySchema = new Schema<IHabitDayDocument, IHabitDayModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    entries: { type: [habitDayEntrySchema], default: [] },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

habitDaySchema.index({ user: 1, date: 1 }, { unique: true });

export const Habit = model<IHabitDocument, IHabitModel>('Habit', habitSchema);
export const HabitDay = model<IHabitDayDocument, IHabitDayModel>('HabitDay', habitDaySchema);
