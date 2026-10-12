export const RECRUITER_INTRO_SEEN_KEY = 'ibadah:recruiter-intro:seen:v1';

export function hasSeenRecruiterIntro(): boolean {
  try {
    return !!localStorage.getItem(RECRUITER_INTRO_SEEN_KEY);
  } catch {
    return false;
  }
}

export function markRecruiterIntroSeen(): void {
  try {
    localStorage.setItem(RECRUITER_INTRO_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

export function resetRecruiterIntroSeen(): void {
  try {
    localStorage.removeItem(RECRUITER_INTRO_SEEN_KEY);
  } catch {
    // ignore
  }
}
