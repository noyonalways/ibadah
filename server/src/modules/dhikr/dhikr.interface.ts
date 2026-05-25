import type { Document, Model, Types } from 'mongoose';

export interface IDhikrEntry {
  slug: string;
  label: string;
  arabic?: string;
  target: number;
  count: number;
}

export interface IDhikrDay {
  user: Types.ObjectId;
  date: Date;
  entries: IDhikrEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDhikrDayDocument extends IDhikrDay, Document {
  _id: Types.ObjectId;
}

export type IDhikrDayModel = Model<IDhikrDayDocument>;
