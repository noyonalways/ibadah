'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  salahApi,
  emptyJummahEntry,
  type JummahEntry,
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

    // Optimistic update so the UI feels instant. We deep-merge `fard`
    // so a partial timing update doesn't wipe sibling boolean flags.
    onMutate: async ({ prayer, entry }) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<SalahDay>(dayKey(date));

      if (prev) {
        const current = prev.prayers[prayer];
        qc.setQueryData<SalahDay>(dayKey(date), {
          ...prev,
          prayers: {
            ...prev.prayers,
            [prayer]: {
              ...current,
              ...entry,
              fard: { ...current.fard, ...(entry.fard ?? {}) },
            },
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

export function useUpdateJummah(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entry: Partial<JummahEntry>) => salahApi.updateJummah(date, entry),

    onMutate: async (entry) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<SalahDay>(dayKey(date));

      if (prev) {
        const current = prev.jummah ?? emptyJummahEntry();
        qc.setQueryData<SalahDay>(dayKey(date), {
          ...prev,
          jummah: {
            ...current,
            ...entry,
            fard: { ...current.fard, ...(entry.fard ?? {}) },
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
