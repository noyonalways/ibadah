/**
 * Salah scoring config — split into:
 *   - Fard timing (per waqt)
 *   - Sunnah-before / Sunnah-after / Nafl (per waqt, independent toggles)
 *   - Witr (separate)
 *   - Jummah (Friday-only — Jummah replaces Dhuhr)
 *
 * Per-user overrides on User.scoring take precedence; getScoring() in
 * salah.service merges them onto these defaults.
 *
 * IMPORTANT: `sunnahBefore` and `sunnahAfter` are per-RAKAH point
 * values — the server multiplies them by the rakah count defined in
 * `PRAYER_SUNNAH_RAKAH` (or `JUMMAH_SUNNAH_RAKAH`) for each prayer when
 * the corresponding toggle is on. This way Fajr's 2-rak'ah sunnah-
 * before pays out half of Dhuhr's 4-rak'ah sunnah-before. The display
 * label in the UI is "<n> rak'ah · +<rakahValue × n>".
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

  /** Points PER RAKAH of Sunnah Mu'akkadah / Ghair-Mu'akkadah before the Fard. */
  sunnahBefore: number;
  /** Points PER RAKAH of Sunnah Mu'akkadah / Ghair-Mu'akkadah after the Fard. */
  sunnahAfter: number;
  /** Voluntary nafl rakat tied to the waqt — flat reward when the user toggles. */
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
  // Fard timing — unchanged.
  fardAwwal: 30,
  fardMid: 20,
  fardLast: 10,
  fardLate: 0,
  fardMissed: -10,

  // Per-rakah sunnah reward (default = 2 points per rakah). With the
  // rakah counts in PRAYER_SUNNAH_RAKAH this lands a daily sunnah cap
  // around 32 points for a non-Friday and ~48 on Fridays — comparable
  // to the previous flat 4-points-per-toggle model in aggregate, but
  // now actually proportional to the work performed.
  sunnahBefore: 2,
  sunnahAfter: 2,
  // Nafl is volunteer-driven and not tied to a specific rakah count, so
  // it stays a flat per-toggle reward.
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
 * Rakah counts for the optional sunnah surrounding each Fard waqt.
 * `0` means that sunnah does not exist for that prayer (Hanafi tradition):
 *
 *   - Fajr        : 2 sunnah-before (mu'akkadah). Nothing after — Salah
 *                   is forbidden after Fajr Fard until sunrise.
 *   - Dhuhr       : 4 sunnah-before (mu'akkadah) + 2 sunnah-after
 *                   (mu'akkadah). Some traditions add 2 more nafl after;
 *                   that is captured by the separate `nafl` toggle.
 *   - Asr         : 4 sunnah-before (ghair-mu'akkadah, optional).
 *                   No sunnah after — Salah is forbidden after Asr Fard
 *                   until Maghrib.
 *   - Maghrib     : Nothing before, 2 sunnah-after (mu'akkadah).
 *   - Isha        : 4 sunnah-before (ghair-mu'akkadah, optional)
 *                   + 2 sunnah-after (mu'akkadah).
 *
 * Operators can adjust per-rakah point values via the Scoring page —
 * the rakah counts themselves are fixed by tradition, not configurable.
 */
export const PRAYER_SUNNAH_RAKAH: Record<
  PrayerName,
  { before: number; after: number }
> = {
  fajr: { before: 2, after: 0 },
  dhuhr: { before: 4, after: 2 },
  asr: { before: 4, after: 0 },
  maghrib: { before: 0, after: 2 },
  isha: { before: 4, after: 2 },
};

/**
 * Friday Jummah — replaces Dhuhr. The classical pattern is 4 sunnah
 * before the Fard and 4 after. Some scholars add 2 more nafl after;
 * that is captured by the separate `nafl` toggle on the Jummah card.
 */
export const JUMMAH_SUNNAH_RAKAH = { before: 4, after: 4 } as const;

/**
 * Convenience helpers — true if a given prayer has any rakah of the
 * named sunnah. Used by the client and admin UIs to hide toggles that
 * don't apply (e.g. "Sunnah after" on Fajr).
 */
export function hasSunnahBefore(prayer: PrayerName): boolean {
  return PRAYER_SUNNAH_RAKAH[prayer].before > 0;
}
export function hasSunnahAfter(prayer: PrayerName): boolean {
  return PRAYER_SUNNAH_RAKAH[prayer].after > 0;
}

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
