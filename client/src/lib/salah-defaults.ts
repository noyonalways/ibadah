import type { SalahScoring } from './user-api';

/**
 * Mirror of `server/src/modules/salah/salah.constants.ts:SALAH_DEFAULT_POINTS`.
 *
 * Used by the client as a render-time fallback while the profile is
 * loading, so cards don't pop in with zeroed point labels. The server
 * is the source of truth — overrides on the user profile take effect
 * as soon as the profile query resolves.
 */
export const SALAH_DEFAULT_SCORING: SalahScoring = {
  fardAwwal: 30,
  fardMid: 20,
  fardLast: 10,
  fardLate: 0,
  fardMissed: -10,
  sunnahBefore: 4,
  sunnahAfter: 4,
  nafl: 3,
  witr: 5,
  jummahFard: 40,
  jummahKhutbah: 10,
  jummahEarly: 5,
  jummahSurahKahf: 5,
  jummahGhusl: 5,
};
