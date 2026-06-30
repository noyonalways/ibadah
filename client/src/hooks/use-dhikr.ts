'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dhikrApi, type DhikrDay, type DhikrEntry } from '@/lib/dhikr/dhikr-api';

const dayKey = (date: string) => ['dhikr', 'day', date] as const;

export function useDhikrDay(date: string) {
  return useQuery<DhikrDay>({
    queryKey: dayKey(date),
    queryFn: () => dhikrApi.getDay(date),
    staleTime: 30_000,
  });
}

export function useUpsertDhikrDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: DhikrEntry[]) => dhikrApi.upsertDay(date, entries),

    onMutate: async (entries) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<DhikrDay>(dayKey(date));
      if (prev) qc.setQueryData<DhikrDay>(dayKey(date), { ...prev, entries });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(dayKey(date), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: dayKey(date) }),
  });
}
