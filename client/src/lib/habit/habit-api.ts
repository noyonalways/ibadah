import { api } from '../api';
import { authStorage } from '../auth/auth-storage';

export interface Habit {
  _id: string;
  name: string;
  description?: string;
  rewardPoints: number;
  color?: string;
  icon?: string;
  archived: boolean;
  createdAt: string;
}

export interface HabitDayEntry {
  habit: string;
  completed: boolean;
}

export interface HabitDay {
  date: string;
  entries: HabitDayEntry[];
  totalPoints: number;
}

const token = () => authStorage.getAccess();

export const habitApi = {
  list: () => api<Habit[]>('/habits', { token: token() }),
  create: (payload: {
    name: string;
    description?: string;
    rewardPoints?: number;
    color?: string;
    icon?: string;
  }) => api<Habit>('/habits', { method: 'POST', body: payload, token: token() }),
  update: (id: string, payload: Partial<Habit>) =>
    api<Habit>(`/habits/${id}`, { method: 'PATCH', body: payload, token: token() }),
  remove: (id: string) =>
    api<null>(`/habits/${id}`, { method: 'DELETE', token: token() }),

  getDay: (date: string) =>
    api<HabitDay>(`/habits/days/${date}`, { token: token() }),
  upsertDay: (date: string, entries: HabitDayEntry[]) =>
    api<HabitDay>(`/habits/days/${date}`, {
      method: 'PUT',
      body: { entries },
      token: token(),
    }),
};
