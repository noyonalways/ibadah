import type { SalahScoring } from './user/user-api';

/**
 * Mirror of `server/src/modules/salah/salah.constants.ts:SALAH_DEFAULT_POINTS`.
 *
 * Used by the client as a render-time fallback while the profile is
 * loading, so cards don't pop in with zeroed point labels. The server
 * is the source of truth — overrides on the user profile take effect
 * as soon as the profile query resolves.
 *
 * `sunnahBefore` and `sunnahAfter` are points PER RAKAH; the actual
 * reward is multiplied by the per-prayer rakah counts in
 * `PRAYER_SUNNAH_RAKAH` / `JUMMAH_SUNNAH_RAKAH`.
 */
export const SALAH_DEFAULT_SCORING: SalahScoring = {
  fardAwwal: 30,
  fardMid: 20,
  fardLast: 10,
  fardLate: 0,
  fardMissed: -10,
  // Per-rakah scoring values (default 2 pts/rakah).
  sunnahBefore: 2,
  sunnahAfter: 2,
  nafl: 3,
  witr: 5,
  jummahFard: 40,
  jummahKhutbah: 10,
  jummahEarly: 5,
  jummahSurahKahf: 5,
  jummahGhusl: 5,
};

/**
 * Per-prayer rakah counts for the optional sunnah surrounding each
 * Fard waqt — kept in lock-step with the server's `PRAYER_SUNNAH_RAKAH`.
 *
 * `0` means the sunnah does not exist for that prayer, in which case
 * the corresponding toggle is HIDDEN in the UI (see `prayer-card.tsx`).
 *
 *   - Fajr        : 2 sunnah-before (mu'akkadah). Nothing after — Salah
 *                   is forbidden after Fajr Fard until sunrise.
 *   - Dhuhr       : 4 sunnah-before + 2 sunnah-after.
 *   - Asr         : 4 sunnah-before (ghair-mu'akkadah). Nothing after.
 *   - Maghrib     : 0 before, 2 sunnah-after.
 *   - Isha        : 4 sunnah-before (ghair-mu'akkadah) + 2 sunnah-after.
 */
import type { PrayerName } from './salah/salah-api';

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

/** Friday Jummah — 4 sunnah-before + 4 sunnah-after. */
export const JUMMAH_SUNNAH_RAKAH = { before: 4, after: 4 } as const;

export function hasSunnahBefore(prayer: PrayerName): boolean {
  return PRAYER_SUNNAH_RAKAH[prayer].before > 0;
}
export function hasSunnahAfter(prayer: PrayerName): boolean {
  return PRAYER_SUNNAH_RAKAH[prayer].after > 0;
}
