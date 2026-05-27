/**
 * Salah scoring config — split into:
 *   - Fard timing (per waqt)
 *   - Sunnah-before / Sunnah-after / Nafl (per waqt, independent toggles)
 *   - Witr (separate)
 *   - Jummah (Friday-only — Jummah replaces Dhuhr)
 *
 * Per-user overrides on User.scoring take precedence; getScoring() in
 * salah.service merges them onto these defaults.
 */
export interface SalahScoring {
  /** Fard performed at the earliest part of the window — most rewarded. */
  fardAwwal: number;
  /** Fard performed in the middle part of the window. */
  fardMid: number;
  /** Fard performed in the last part of the window — still on time. */
  fardLast: number;
  /** Fard performed past the window (qaza/late). No reward, no penalty by default. */
  fardLate: number;
  /** Fard not performed at all. */
  fardMissed: number;

  /** Sunnah Mu'akkadah / Ghair-Mu'akkadah recited before the Fard. */
  sunnahBefore: number;
  /** Sunnah Mu'akkadah / Ghair-Mu'akkadah recited after the Fard. */
  sunnahAfter: number;
  /** Voluntary nafl rakat tied to the waqt. */
  nafl: number;

  /** Witr after Isha (its own pillar). */
  witr: number;

  /** Jummah-specific (replaces Dhuhr on Fridays) ----------------------- */
  /** The 2-rak'at Jummah Fard with the Imam — heavier reward than Dhuhr. */
  jummahFard: number;
  /** Listened attentively to the full Khutbah. */
  jummahKhutbah: number;
  /** Arrived early, before the Imam ascended the minbar. */
  jummahEarly: number;
  /** Recited Surah Al-Kahf on Friday. */
  jummahSurahKahf: number;
  /** Performed Ghusl (the major ritual washing) on Friday. */
  jummahGhusl: number;
}

export const SALAH_DEFAULT_POINTS: SalahScoring = {
  // Fard timing — same values as before, renamed and grouped.
  fardAwwal: 30,
  fardMid: 20,
  fardLast: 10,
  fardLate: 0,
  fardMissed: -10,

  // Sunnah / Nafl — three independent toggles per waqt.
  sunnahBefore: 4,
  sunnahAfter: 4,
  nafl: 3,

  // Witr — separate.
  witr: 5,

  // Jummah — Friday-specific. Jummah Fard carries higher reward than Dhuhr.
  jummahFard: 40,
  jummahKhutbah: 10,
  jummahEarly: 5,
  jummahSurahKahf: 5,
  jummahGhusl: 5,
};

export const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

/**
 * Fard timing statuses. The `pending` value represents "not yet logged"
 * and contributes 0 points (regardless of scoring config).
 */
export const PRAYER_STATUSES = [
  'pending',
  'on_time_awwal',
  'on_time_mid',
  'on_time_last',
  'late',
  'missed',
] as const;
export type PrayerStatus = (typeof PRAYER_STATUSES)[number];

/**
 * Boolean Jummah-specific flags. Used for both validation and the
 * settings UI grouping.
 */
export const JUMMAH_FLAGS = [
  'khutbah',
  'earlyArrival',
  'surahKahf',
  'ghusl',
] as const;
export type JummahFlag = (typeof JUMMAH_FLAGS)[number];

/**
 * Per-prayer boolean flags shared by all waqt prayers AND Jummah.
 */
export const PRAYER_FLAGS = ['sunnahBefore', 'sunnahAfter', 'nafl'] as const;
export type PrayerFlag = (typeof PRAYER_FLAGS)[number];

/** Day-of-week for Friday using a YYYY-MM-DD day key (UTC convention). */
export function isFridayDayKey(dayKey: string): boolean {
  // The day key represents the user's local-day, but we canonicalize as UTC
  // midnight on the server, so reading getUTCDay() gives the same weekday
  // the user sees on their calendar.
  const d = new Date(`${dayKey}T00:00:00Z`);
  return d.getUTCDay() === 5;
}
