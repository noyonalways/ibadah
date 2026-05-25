/**
 * Salah scoring rules. Per-user overrides on User.scoring take precedence
 * (see calculatePoints in salah.service).
 */
export const SALAH_DEFAULT_POINTS = {
  onTimeAwwal: 30, // earliest part of the prayer window
  onTimeMid: 20, // middle of the window
  onTimeLast: 10, // last part of the window (still on-time / pre-qaza)
  late: 0, // late / qaza — no penalty, no reward
  missed: -10,
  sunnahNafil: 5, // bonus per prayer where sunnah/nafil performed
  witr: 5, // separate witr bonus
} as const;

export const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export const PRAYER_STATUSES = [
  'pending',
  'on_time_awwal',
  'on_time_mid',
  'on_time_last',
  'late',
  'missed',
] as const;
export type PrayerStatus = (typeof PRAYER_STATUSES)[number];
