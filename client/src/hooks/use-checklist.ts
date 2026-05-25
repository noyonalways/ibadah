'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistApi, type ChecklistDay, type ChecklistItem } from '@/lib/checklist-api';

const dayKey = (date: string) => ['checklist', 'day', date] as const;

export function useChecklistDay(date: string) {
  return useQuery<ChecklistDay>({
    queryKey: dayKey(date),
    queryFn: () => checklistApi.getDay(date),
    staleTime: 30_000,
  });
}

export function useUpsertChecklistDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ChecklistItem[]) => checklistApi.upsertDay(date, items),

    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const prev = qc.getQueryData<ChecklistDay>(dayKey(date));
      if (prev) {
        const totalPoints = items
          .filter((i) => i.completed)
          .reduce((s, i) => s + (i.rewardPoints ?? 0), 0);
        qc.setQueryData<ChecklistDay>(dayKey(date), { ...prev, items, totalPoints });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(dayKey(date), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: dayKey(date) }),
  });
}
