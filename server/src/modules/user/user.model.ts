import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUserDocument, IUserModel, SafeUser } from '@/modules/user/user.interface';

const checklistTemplateItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    rewardPoints: { type: Number, default: 5, min: -100, max: 100 },
  },
  { _id: false },
);

const scoringSchema = new Schema(
  {
    fardAwwal: { type: Number },
    fardMid: { type: Number },
    fardLast: { type: Number },
    fardLate: { type: Number },
    fardMissed: { type: Number },
    sunnahBefore: { type: Number },
    sunnahAfter: { type: Number },
    nafl: { type: Number },
    witr: { type: Number },
    jummahFard: { type: Number },
    jummahKhutbah: { type: Number },
    jummahEarly: { type: Number },
    jummahSurahKahf: { type: Number },
    jummahGhusl: { type: Number },
  },
  { _id: false },
);

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false },
    googleId: { type: String, index: true, sparse: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatarUrl: { type: String, trim: true },
    locale: { type: String, enum: ['en', 'bn', 'ar'], default: 'en' },
    timezone: { type: String, default: 'UTC' },
    scoring: { type: scoringSchema, default: undefined },
    defaultChecklistItems: { type: [checklistTemplateItemSchema], default: [] },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    lastActiveAt: { type: Date, index: true },
    suspended: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function (): SafeUser {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    avatarUrl: this.avatarUrl,
    locale: this.locale,
    timezone: this.timezone,
    hasPassword: Boolean(this.passwordHash),
    hasGoogle: Boolean(this.googleId),
    role: this.role,
    suspended: this.suspended,
    lastActiveAt: this.lastActiveAt,
    createdAt: this.createdAt,
  };
};

export const User = model<IUserDocument, IUserModel>('User', userSchema);
