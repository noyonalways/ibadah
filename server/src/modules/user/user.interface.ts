import type { Document, Model, Types } from 'mongoose';

export interface IChecklistTemplateItem {
  title: string;
  rewardPoints: number;
}

export interface IUser {
  email: string;
  /** Optional — OAuth-only users have no password. */
  passwordHash?: string;
  /** Google subject id when account is linked to a Google identity. */
  googleId?: string;
  name: string;
  avatarUrl?: string;
  locale: 'en' | 'bn' | 'ar';
  timezone: string;
  /** Per-user salah scoring overrides. Falls back to defaults. */
  scoring?: {
    onTimeAwwal?: number;
    onTimeMid?: number;
    onTimeLast?: number;
    missed?: number;
    sunnahNafil?: number;
    witr?: number;
  };
  /** Default checklist items auto-applied to a new day's checklist. */
  defaultChecklistItems?: IChecklistTemplateItem[];
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
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt: Date;
}

export type IUserModel = Model<IUserDocument>;
