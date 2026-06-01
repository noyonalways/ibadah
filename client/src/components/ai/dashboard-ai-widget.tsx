'use client';

import { useCallback } from 'react';
import { usePathname } from '@/i18n/routing';
import { useQueryClient } from '@tanstack/react-query';

import { AIWidget } from './ai-widget';

/**
 * Dashboard-flavored wrapper around `<AIWidget>`. Responsibilities:
 *
 *   1. Hide the widget on the dedicated `/assistant` page so the
 *      floating launcher doesn't double up the full-page chat.
 *   2. Inject a small JSON context blob built from the user's recent
 *      stats already cached by TanStack Query (no extra fetch). The
 *      assistant uses this to ground its replies and to chart the
 *      user's actual numbers.
 */
export function DashboardAIWidget() {
  const pathname = usePathname();
  const qc = useQueryClient();

  const hidden = /\/assistant(\/|$)/.test(pathname);

  const buildContext = useCallback((): string | undefined => {
    // We pull whatever the dashboard already populated in the query
    // cache. This avoids a duplicate request and means the widget
    // automatically re-uses fresh data once the user navigates.
    const allCaches = qc.getQueryCache().getAll();

    // Pick out the most recent `stats/daily` cache (the heatmap
    // window) and the `stats/streaks` cache.
    const dailyEntry = allCaches
      .filter((q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'stats' && q.queryKey[1] === 'daily')
      .sort((a, b) => Number(b.state.dataUpdatedAt) - Number(a.state.dataUpdatedAt))[0];
    const streaksEntry = allCaches.find(
      (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'stats' && q.queryKey[1] === 'streaks',
    );

    const days = (dailyEntry?.state.data as { date: string; total: number }[] | undefined) ?? [];
    const streaks = streaksEntry?.state.data as { current: number; longest: number } | undefined;

    if (days.length === 0 && !streaks) return undefined;

    // Trim to last 14 days to keep the prompt short.
    const recent = days.slice(-14);
    const summary = {
      windowDays: recent.length,
      totalPoints: recent.reduce((s, d) => s + (Number(d.total) || 0), 0),
      currentStreak: streaks?.current ?? null,
      longestStreak: streaks?.longest ?? null,
      daily: recent.map((d) => ({ date: d.date, total: d.total })),
    };

    return JSON.stringify(summary);
  }, [qc]);

  return (
    <AIWidget
      hidden={hidden}
      surface="dashboard"
      buildContext={buildContext}
      liftAboveBottomNav
      suggestions={[
        'Summarize my last week',
        'Chart my points by day',
        'How does Awwal Waqt scoring work?',
      ]}
    />
  );
}
