import { api } from './api';
import { authStorage } from './auth-storage';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerStatus =
  | 'pending'
  | 'on_time_awwal'
  | 'on_time_mid'
  | 'on_time_last'
  | 'late'
  | 'missed';

export interface FardEntry {
  status: PrayerStatus;
}

/** Per-waqt entry: fard + three independent boolean flags. */
export interface PrayerEntry {
  fard: FardEntry;
  sunnahBefore: boolean;
  sunnahAfter: boolean;
  nafl: boolean;
  notes?: string;
}

/** Friday Jummah: same as PrayerEntry plus four Friday-only flags. */
export interface JummahEntry {
  fard: FardEntry;
  sunnahBefore: boolean;
  sunnahAfter: boolean;
  nafl: boolean;
  khutbah: boolean;
  earlyArrival: boolean;
  surahKahf: boolean;
  ghusl: boolean;
  notes?: string;
}

export type Prayers = Record<PrayerName, PrayerEntry>;

export interface SalahDay {
  date: string; // YYYY-MM-DD
  isFriday: boolean;
  prayers: Prayers;
  /** Populated only on Fridays once the user logs anything Jummah-specific. */
  jummah?: JummahEntry;
  witr: boolean;
  totalPoints: number;
}

const tokenHeader = () => authStorage.getAccess();

export const salahApi = {
  getDay: (date: string) =>
    api<SalahDay>(`/salah/${date}`, { token: tokenHeader() }),

  upsertDay: (
    date: string,
    payload: {
      prayers?: Partial<Prayers>;
      jummah?: Partial<JummahEntry>;
      witr?: boolean;
    },
  ) =>
    api<SalahDay>(`/salah/${date}`, {
      method: 'PUT',
      body: payload,
      token: tokenHeader(),
    }),

  updatePrayer: (date: string, prayer: PrayerName, entry: Partial<PrayerEntry>) =>
    api<SalahDay>(`/salah/${date}/${prayer}`, {
      method: 'PATCH',
      body: entry,
      token: tokenHeader(),
    }),

  /** Friday-only — server returns 400 if the date isn't a Friday. */
  updateJummah: (date: string, entry: Partial<JummahEntry>) =>
    api<SalahDay>(`/salah/${date}/jummah`, {
      method: 'PATCH',
      body: entry,
      token: tokenHeader(),
    }),

  range: (from: string, to: string) =>
    api<SalahDay[]>(`/salah?from=${from}&to=${to}`, { token: tokenHeader() }),
};

/* ------------------------------------------------------------------ *
 * Empty defaults — used by hooks for optimistic updates and by the    *
 * UI to render a Friday card before the user has logged anything.     *
 * ------------------------------------------------------------------ */

export const emptyFard = (): FardEntry => ({ status: 'pending' });

export const emptyPrayerEntry = (): PrayerEntry => ({
  fard: emptyFard(),
  sunnahBefore: false,
  sunnahAfter: false,
  nafl: false,
});

export const emptyJummahEntry = (): JummahEntry => ({
  ...emptyPrayerEntry(),
  khutbah: false,
  earlyArrival: false,
  surahKahf: false,
  ghusl: false,
});

/** Did the user log anything meaningful in the Jummah slot? */
export function isJummahLogged(j: JummahEntry | undefined): boolean {
  if (!j) return false;
  if (j.fard.status !== 'pending') return true;
  return (
    j.sunnahBefore ||
    j.sunnahAfter ||
    j.nafl ||
    j.khutbah ||
    j.earlyArrival ||
    j.surahKahf ||
    j.ghusl
  );
}
