export const LANDING_ONBOARDING_KEY = 'ibadah:landing-onboarding:v2';
export const ONBOARDING_PREFS_KEY = 'ibadah:onboarding-prefs';

export type OnboardingPersona = 'beginner' | 'consistent' | 'returning';
export type OnboardingFocus = 'salah' | 'quran' | 'dhikr' | 'habits' | 'checklist';

export interface OnboardingPreferences {
  persona: OnboardingPersona;
  focus: OnboardingFocus[];
}

export function loadOnboardingPrefs(): OnboardingPreferences | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingPreferences;
  } catch {
    return null;
  }
}

export function saveOnboardingPrefs(prefs: OnboardingPreferences) {
  try {
    localStorage.setItem(ONBOARDING_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
