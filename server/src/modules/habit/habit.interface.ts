import type { Document, Model, Types } from 'mongoose';

/** A user-defined habit (the *definition*). */
export interface IHabit {
  user: Types.ObjectId;
  name: string;
  description?: string;
  rewardPoints: number;
  color?: string;
  icon?: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHabitDocument extends IHabit, Document {
  _id: Types.ObjectId;
}

export type IHabitModel = Model<IHabitDocument>;

/** Daily completion log per user — stores which habits were completed. */
export interface IHabitDayEntry {
  habit: Types.ObjectId;
  completed: boolean;
}

export interface IHabitDay {
  user: Types.ObjectId;
  date: Date;
  entries: IHabitDayEntry[];
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHabitDayDocument extends IHabitDay, Document {
  _id: Types.ObjectId;
}

export type IHabitDayModel = Model<IHabitDayDocument>;
