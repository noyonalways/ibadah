import type { Document, Model, Types } from 'mongoose';

export type OnboardingPersona = 'beginner' | 'consistent' | 'returning';
export type OnboardingFocus = 'salah' | 'quran' | 'dhikr' | 'habits' | 'checklist';
export type OnboardingLocale = 'en' | 'bn' | 'ar';
export type OnboardingSource = 'mobile_landing';

export interface IOnboardingSubmission {
  persona: OnboardingPersona;
  focus: OnboardingFocus[];
  locale: OnboardingLocale;
  source: OnboardingSource;
  user?: Types.ObjectId;
  userEmail?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOnboardingSubmissionDocument extends IOnboardingSubmission, Document {
  _id: Types.ObjectId;
}

export type IOnboardingSubmissionModel = Model<IOnboardingSubmissionDocument>;
