'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dhikrApi, type DhikrDay, type DhikrEntry } from '@/lib/dhikr/dhikr-api';

const dayKey = (date: string) => ['dhikr', 'day', date] as const;

/** Wait for rapid taps to settle before syncing to the server. */
const SAVE_DEBOUNCE_MS = 700;

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
    onSuccess: (saved) => {
      qc.setQueryData<DhikrDay>(dayKey(date), saved);
    },
  });
}

type EntriesUpdater = DhikrEntry[] | ((prev: DhikrEntry[]) => DhikrEntry[]);

/**
 * Local-first dhikr state with debounced server sync.
 * UI updates instantly on every tap; API calls are batched so rapid
 * counting does not hit rate limits.
 */
export function useDhikrEntries(date: string) {
  const qc = useQueryClient();
  const { data, isLoading } = useDhikrDay(date);

  const [entries, setEntriesState] = useState<DhikrEntry[]>([]);
  const entriesRef = useRef<DhikrEntry[]>([]);
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;

  const upsert = useUpsertDhikrDay(date);

  const patchCache = useCallback(
    (next: DhikrEntry[]) => {
      const cached = qc.getQueryData<DhikrDay>(dayKey(dateRef.current));
      if (cached) {
        qc.setQueryData<DhikrDay>(dayKey(dateRef.current), { ...cached, entries: next });
      }
    },
    [qc],
  );

  const flushSaveRef = useRef<() => void>(() => {});

  flushSaveRef.current = () => {
    if (versionRef.current <= savedVersionRef.current) return;

    const toSave = entriesRef.current;
    const saveVersion = versionRef.current;

    upsert.mutate(toSave, {
      onSuccess: (saved) => {
        qc.setQueryData<DhikrDay>(dayKey(dateRef.current), saved);
        if (saveVersion >= savedVersionRef.current) {
          savedVersionRef.current = saveVersion;
        }
        if (versionRef.current > savedVersionRef.current) {
          scheduleSaveRef.current();
        }
      },
      onError: () => {
        scheduleSaveRef.current();
      },
    });
  };

  const scheduleSaveRef = useRef<() => void>(() => {});

  scheduleSaveRef.current = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushSaveRef.current();
    }, SAVE_DEBOUNCE_MS);
  };

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    flushSaveRef.current();
  }, []);

  const setEntries = useCallback(
    (updater: EntriesUpdater) => {
      setEntriesState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        entriesRef.current = next;
        versionRef.current += 1;
        patchCache(next);
        return next;
      });
      scheduleSaveRef.current();
    },
    [patchCache],
  );

  // Hydrate from server when the day loads and there are no unsaved local edits.
  useEffect(() => {
    if (!data) return;
    if (versionRef.current > savedVersionRef.current) return;
    const next = data.entries ?? [];
    entriesRef.current = next;
    setEntriesState(next);
  }, [data]);

  // Reset when switching days; flush the previous day on the way out.
  useEffect(() => {
    const capturedDate = date;

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (versionRef.current > savedVersionRef.current) {
        const pending = entriesRef.current;
        const v = versionRef.current;
        void dhikrApi
          .upsertDay(capturedDate, pending)
          .then((saved) => {
            qc.setQueryData<DhikrDay>(dayKey(capturedDate), saved);
          })
          .catch(() => {});
        savedVersionRef.current = v;
      }
    };
  }, [date, qc]);

  useEffect(() => {
    versionRef.current = 0;
    savedVersionRef.current = 0;
    entriesRef.current = [];
    setEntriesState([]);
  }, [date]);

  // Flush when the tab is hidden so counts are not lost on close/navigation.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flushSave]);

  return {
    entries,
    isLoading,
    setEntries,
    flushSave,
    isSaving: upsert.isPending,
  };
}
