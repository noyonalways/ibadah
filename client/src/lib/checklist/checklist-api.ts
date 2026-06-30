import { api } from './api';
import { authStorage } from './auth-storage';

export interface ChecklistItem {
  _id?: string;
  title: string;
  rewardPoints: number;
  completed: boolean;
  notes?: string;
}

export interface ChecklistDay {
  date: string;
  items: ChecklistItem[];
  totalPoints: number;
}

const token = () => authStorage.getAccess();

export const checklistApi = {
  getDay: (date: string) => api<ChecklistDay>(`/checklist/${date}`, { token: token() }),
  upsertDay: (date: string, items: ChecklistItem[]) =>
    api<ChecklistDay>(`/checklist/${date}`, {
      method: 'PUT',
      body: { items },
      token: token(),
    }),
};
