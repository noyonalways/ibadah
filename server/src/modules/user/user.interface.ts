import type { Document, Model, Types } from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  locale: 'en' | 'bn' | 'ar';
  timezone: string;
  // Per-user salah scoring overrides (optional). Falls back to defaults.
  scoring?: {
    onTimeAwwal?: number;
    onTimeMid?: number;
    onTimeLast?: number;
    missed?: number;
    sunnahNafil?: number;
    witr?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(plain: string): Promise<boolean>;
  toSafeJSON(): SafeUser;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  locale: IUser['locale'];
  timezone: string;
  createdAt: Date;
}

export type IUserModel = Model<IUserDocument>;
