import { z } from 'zod';

const personaSchema = z.enum(['beginner', 'consistent', 'returning']);
const focusSchema = z.enum(['salah', 'quran', 'dhikr', 'habits', 'checklist']);
const localeSchema = z.enum(['en', 'bn', 'ar']);

export const submitOnboardingSchema = z.object({
  body: z.object({
    persona: personaSchema,
    focus: z.array(focusSchema).min(1).max(5),
    locale: localeSchema,
    source: z.literal('mobile_landing').optional(),
  }),
});

export const listOnboardingSchema = z.object({
  query: z.object({
    persona: personaSchema.optional(),
    locale: localeSchema.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const onboardingSummarySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).optional(),
  }),
});

export type SubmitOnboardingDto = z.infer<typeof submitOnboardingSchema>['body'];
export type ListOnboardingDto = z.infer<typeof listOnboardingSchema>['query'];
export type OnboardingSummaryDto = z.infer<typeof onboardingSummarySchema>['query'];
