import { api } from './api';
import { authStorage } from './auth-storage';

export interface DhikrEntry {
  slug: string;
  label: string;
  arabic?: string;
  target: number;
  count: number;
}

export interface DhikrDay {
  date: string;
  entries: DhikrEntry[];
}

export interface DhikrPreset {
  slug: string;
  label: string;
  defaultTarget: number;
  arabic: string;
}

const token = () => authStorage.getAccess();

export const dhikrApi = {
  presets: () => api<DhikrPreset[]>('/dhikr/presets', { token: token() }),
  getDay: (date: string) => api<DhikrDay>(`/dhikr/${date}`, { token: token() }),
  upsertDay: (date: string, entries: DhikrEntry[]) =>
    api<DhikrDay>(`/dhikr/${date}`, { method: 'PUT', body: { entries }, token: token() }),
};
