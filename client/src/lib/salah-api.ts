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

export interface PrayerEntry {
  status: PrayerStatus;
  sunnahNafil: boolean;
  notes?: string;
}

export type Prayers = Record<PrayerName, PrayerEntry>;

export interface SalahDay {
  date: string; // YYYY-MM-DD
  prayers: Prayers;
  witr: boolean;
  totalPoints: number;
}

const tokenHeader = () => authStorage.getAccess();

export const salahApi = {
  getDay: (date: string) =>
    api<SalahDay>(`/salah/${date}`, { token: tokenHeader() }),

  upsertDay: (
    date: string,
    payload: { prayers?: Partial<Prayers>; witr?: boolean },
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

  range: (from: string, to: string) =>
    api<SalahDay[]>(`/salah?from=${from}&to=${to}`, { token: tokenHeader() }),
};
