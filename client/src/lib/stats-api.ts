import { api } from './api';
import { authStorage } from './auth-storage';

export interface DayPoints {
  date: string;
  salah: number;
  habit: number;
  checklist: number;
  quranPages: number;
  total: number;
}

export interface Streaks {
  current: number;
  longest: number;
}

const token = () => authStorage.getAccess();

export const statsApi = {
  daily: (from: string, to: string) =>
    api<DayPoints[]>(`/stats/daily?from=${from}&to=${to}`, { token: token() }),
  streaks: () => api<Streaks>('/stats/streaks', { token: token() }),
};
