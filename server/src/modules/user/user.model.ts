import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUserDocument, IUserModel, SafeUser } from './user.interface.js';

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
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatarUrl: { type: String, trim: true },
    locale: { type: String, enum: ['en', 'bn', 'ar'], default: 'en' },
    timezone: { type: String, default: 'UTC' },
    scoring: {
      onTimeAwwal: { type: Number },
      onTimeMid: { type: Number },
      onTimeLast: { type: Number },
      missed: { type: Number },
      sunnahNafil: { type: Number },
      witr: { type: Number },
    },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
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
    createdAt: this.createdAt,
  };
};

export const User = model<IUserDocument, IUserModel>('User', userSchema);
