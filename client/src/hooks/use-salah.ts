'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  salahApi,
  type PrayerEntry,
  type PrayerName,
  type SalahDay,
} from '@/lib/salah-api';

const dayKey = (date: string) => ['salah', 'day', date] as const;

export function useSalahDay(date: string) {
  return useQuery<SalahDay>({
    queryKey: dayKey(date),
    queryFn: () => salahApi.getDay(date),
    staleTime: 30_000,
  });
}

export function useUpdatePrayer(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ prayer, entry }: { prayer: PrayerName; entry: Partial<PrayerEntry> }) =>
      salahApi.updatePrayer(date, prayer, entry),

    // Optimistic update so the UI feels instant.
    onMutate: async ({ prayer, entry }) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<SalahDay>(dayKey(date));

      if (prev) {
        qc.setQueryData<SalahDay>(dayKey(date), {
          ...prev,
          prayers: {
            ...prev.prayers,
            [prayer]: { ...prev.prayers[prayer], ...entry },
          },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(dayKey(date), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dayKey(date) });
    },
  });
}

export function useToggleWitr(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (witr: boolean) => salahApi.upsertDay(date, { witr }),
    onMutate: async (witr) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<SalahDay>(dayKey(date));
      if (prev) qc.setQueryData<SalahDay>(dayKey(date), { ...prev, witr });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(dayKey(date), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dayKey(date) });
    },
  });
}
