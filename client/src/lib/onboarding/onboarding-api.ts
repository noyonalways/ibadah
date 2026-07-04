import { api } from '@/lib/api';
import type {
  OnboardingFocus,
  OnboardingPersona,
  OnboardingPreferences,
} from '@/components/landing/landing-onboarding-prefs';

export interface OnboardingSubmissionPayload extends OnboardingPreferences {
  locale: 'en' | 'bn' | 'ar';
  source?: 'mobile_landing';
}

export interface OnboardingSubmissionResult {
  id: string;
  persona: OnboardingPersona;
  focus: OnboardingFocus[];
  locale: string;
  source: string;
  createdAt: string;
}

export const onboardingApi = {
  submit: (body: OnboardingSubmissionPayload) =>
    api<OnboardingSubmissionResult>('/onboarding/submissions', {
      method: 'POST',
      body: { ...body, source: body.source ?? 'mobile_landing' },
    }),
};

/**
 * Fire-and-forget persistence for mobile landing onboarding. Local prefs
 * are saved first; the API call is best-effort and must not block UX.
 */
export function persistOnboardingToServer(
  prefs: OnboardingPreferences,
  locale: 'en' | 'bn' | 'ar',
): void {
  void onboardingApi
    .submit({ ...prefs, locale, source: 'mobile_landing' })
    .catch(() => {
      // Anonymous visitors may be offline or rate-limited — local prefs still apply.
    });
}
