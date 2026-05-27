import type { SalahScoring } from './user-api';

/**
 * Pure helpers to compute the day's running and maximum possible points
 * from a SalahScoring config. Mirror of the server-side calculator —
 * kept in sync with `server/src/modules/salah/salah.service.ts`.
 *
 * The UI uses these for:
 *   - "X / Y points today" copy on the Salah hero
 *   - The dynamic max for the dashboard Salah ring
 *   - Showing per-toggle point values inside each card
 */

/** Highest reward a single fard can give on a regular waqt. */
export function bestFard(scoring: SalahScoring): number {
  return Math.max(scoring.fardAwwal, scoring.fardMid, scoring.fardLast);
}

/** Highest possible reward from one regular waqt prayer. */
export function maxRegularPrayer(scoring: SalahScoring): number {
  return (
    bestFard(scoring) +
    Math.max(0, scoring.sunnahBefore) +
    Math.max(0, scoring.sunnahAfter) +
    Math.max(0, scoring.nafl)
  );
}

/** Highest possible reward from a single Jummah. */
export function maxJummah(scoring: SalahScoring): number {
  return (
    Math.max(0, scoring.jummahFard) +
    Math.max(0, scoring.sunnahBefore) +
    Math.max(0, scoring.sunnahAfter) +
    Math.max(0, scoring.nafl) +
    Math.max(0, scoring.jummahKhutbah) +
    Math.max(0, scoring.jummahEarly) +
    Math.max(0, scoring.jummahSurahKahf) +
    Math.max(0, scoring.jummahGhusl)
  );
}

/** Maximum total Salah points achievable on the given day. */
export function maxDailyPoints(scoring: SalahScoring, isFriday: boolean): number {
  const everyday = maxRegularPrayer(scoring);
  const witr = Math.max(0, scoring.witr);
  if (isFriday) {
    // 4 regular waqts (Fajr, Asr, Maghrib, Isha) + Jummah + Witr
    return 4 * everyday + maxJummah(scoring) + witr;
  }
  return 5 * everyday + witr;
}
