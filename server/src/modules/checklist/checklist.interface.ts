import type { Document, Model, Types } from 'mongoose';

export interface IChecklistItem {
  _id?: Types.ObjectId;
  title: string;
  rewardPoints: number;
  completed: boolean;
  notes?: string;
}

export interface IChecklistDay {
  user: Types.ObjectId;
  date: Date;
  items: IChecklistItem[];
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChecklistDayDocument extends IChecklistDay, Document {
  _id: Types.ObjectId;
}

export type IChecklistDayModel = Model<IChecklistDayDocument>;
