import { api } from '../api';
import { authStorage } from '../auth/auth-storage';

export interface QuranDay {
  date: string;
  pagesRead: number;
  minutesRead: number;
  surahFrom?: number;
  ayahFrom?: number;
  surahTo?: number;
  ayahTo?: number;
  notes?: string;
}

const token = () => authStorage.getAccess();

export const quranApi = {
  getDay: (date: string) => api<QuranDay>(`/quran/${date}`, { token: token() }),
  upsertDay: (date: string, payload: Partial<Omit<QuranDay, 'date'>>) =>
    api<QuranDay>(`/quran/${date}`, { method: 'PUT', body: payload, token: token() }),
  range: (from: string, to: string) =>
    api<QuranDay[]>(`/quran?from=${from}&to=${to}`, { token: token() }),
};
