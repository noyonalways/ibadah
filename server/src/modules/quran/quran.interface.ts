import type { Document, Model, Types } from 'mongoose';

export interface IQuranDay {
  user: Types.ObjectId;
  date: Date;
  pagesRead: number;
  minutesRead: number;
  surahFrom?: number;
  ayahFrom?: number;
  surahTo?: number;
  ayahTo?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuranDayDocument extends IQuranDay, Document {
  _id: Types.ObjectId;
}

export type IQuranDayModel = Model<IQuranDayDocument>;
