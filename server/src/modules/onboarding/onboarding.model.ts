import { Schema, model } from 'mongoose';

import type {
  IOnboardingSubmissionDocument,
  IOnboardingSubmissionModel,
} from '@/modules/onboarding/onboarding.interface';

const onboardingSubmissionSchema = new Schema<
  IOnboardingSubmissionDocument,
  IOnboardingSubmissionModel
>(
  {
    persona: {
      type: String,
      required: true,
      enum: ['beginner', 'consistent', 'returning'],
      index: true,
    },
    focus: {
      type: [String],
      required: true,
      enum: ['salah', 'quran', 'dhikr', 'habits', 'checklist'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one focus area is required',
      },
    },
    locale: {
      type: String,
      required: true,
      enum: ['en', 'bn', 'ar'],
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: ['mobile_landing'],
      default: 'mobile_landing',
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, trim: true, maxlength: 320 },
    userName: { type: String, trim: true, maxlength: 120 },
    ip: { type: String, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: 'onboarding_submissions' },
);

onboardingSubmissionSchema.index({ createdAt: -1 });

export const OnboardingSubmission = model<
  IOnboardingSubmissionDocument,
  IOnboardingSubmissionModel
>('Onboarding_Submission', onboardingSubmissionSchema);
