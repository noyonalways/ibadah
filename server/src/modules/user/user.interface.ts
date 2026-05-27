import type { Document, Model, Types } from 'mongoose';

export interface IChecklistTemplateItem {
  title: string;
  rewardPoints: number;
}

/**
 * Per-user salah scoring overrides. Every field is optional — missing
 * keys fall back to `SALAH_DEFAULT_POINTS` at scoring-time.
 */
export interface IUserScoring {
  fardAwwal?: number;
  fardMid?: number;
  fardLast?: number;
  fardLate?: number;
  fardMissed?: number;
  sunnahBefore?: number;
  sunnahAfter?: number;
  nafl?: number;
  witr?: number;
  jummahFard?: number;
  jummahKhutbah?: number;
  jummahEarly?: number;
  jummahSurahKahf?: number;
  jummahGhusl?: number;
}

/**
 * Authorization roles. The set is small and closed by design — escalating
 * privileges happens server-side via the `seed:admin` script or by an
 * existing admin via PATCH /admin/users/:id.
 */
export type UserRole = 'user' | 'admin';

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
  scoring?: IUserScoring;
  /** Default checklist items auto-applied to a new day's checklist. */
  defaultChecklistItems?: IChecklistTemplateItem[];
  /** Authorization role. New accounts always start as 'user'. */
  role: UserRole;
  /** Last time we observed an authenticated request from this user. */
  lastActiveAt?: Date;
  /** When set, the account cannot log in or call protected endpoints. */
  suspended: boolean;
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
  role: UserRole;
  suspended: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

export type IUserModel = Model<IUserDocument>;
