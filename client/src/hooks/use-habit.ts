'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { habitApi, type Habit, type HabitDay, type HabitDayEntry } from '@/lib/habit-api';

const HABITS_KEY = ['habits', 'list'] as const;
const dayKey = (date: string) => ['habits', 'day', date] as const;

export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: HABITS_KEY,
    queryFn: habitApi.list,
    staleTime: 60_000,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: habitApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Habit> }) =>
      habitApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: habitApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useHabitDay(date: string) {
  return useQuery<HabitDay>({
    queryKey: dayKey(date),
    queryFn: () => habitApi.getDay(date),
    staleTime: 30_000,
  });
}

export function useUpsertHabitDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: HabitDayEntry[]) => habitApi.upsertDay(date, entries),

    onMutate: async (entries) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<HabitDay>(dayKey(date));
      if (prev) qc.setQueryData<HabitDay>(dayKey(date), { ...prev, entries });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(dayKey(date), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: dayKey(date) }),
  });
}
