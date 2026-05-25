'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quranApi, type QuranDay } from '@/lib/quran-api';

const dayKey = (date: string) => ['quran', 'day', date] as const;

export function useQuranDay(date: string) {
  return useQuery<QuranDay>({
    queryKey: dayKey(date),
    queryFn: () => quranApi.getDay(date),
    staleTime: 30_000,
  });
}

export function useUpsertQuranDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Omit<QuranDay, 'date'>>) => quranApi.upsertDay(date, payload),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<QuranDay>(dayKey(date));
      if (prev) {
        qc.setQueryData<QuranDay>(dayKey(date), { ...prev, ...payload });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(dayKey(date), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: dayKey(date) }),
  });
}
