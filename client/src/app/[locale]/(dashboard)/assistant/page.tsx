'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

import { AIPanel } from '@/components/ai/ai-panel';

/**
 * Dedicated assistant page — same chat surface as the floating
 * widget, just full-bleed inside the dashboard shell so users have
 * room to read longer answers and inline charts.
 *
 * The widget is hidden on this route (see DashboardAIWidget) so we
 * don't double up on launchers.
 */
export default function AssistantPage() {
  const t = useTranslations();
  const qc = useQueryClient();

  const buildContext = useCallback((): string | undefined => {
    const allCaches = qc.getQueryCache().getAll();
    const dailyEntry = allCaches
      .filter((q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'stats' && q.queryKey[1] === 'daily')
      .sort((a, b) => Number(b.state.dataUpdatedAt) - Number(a.state.dataUpdatedAt))[0];
    const streaksEntry = allCaches.find(
      (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'stats' && q.queryKey[1] === 'streaks',
    );

    const days = (dailyEntry?.state.data as { date: string; total: number }[] | undefined) ?? [];
    const streaks = streaksEntry?.state.data as { current: number; longest: number } | undefined;
    if (days.length === 0 && !streaks) return undefined;

    const recent = days.slice(-30);
    return JSON.stringify({
      windowDays: recent.length,
      totalPoints: recent.reduce((s, d) => s + (Number(d.total) || 0), 0),
      currentStreak: streaks?.current ?? null,
      longestStreak: streaks?.longest ?? null,
      daily: recent.map((d) => ({ date: d.date, total: d.total })),
    });
  }, [qc]);

  return (
    <>
      <header className="mb-4">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {t('Assistant.eyebrow')}
        </p>
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent-deep text-white shadow-sm shadow-primary/30">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('Assistant.title')}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('Assistant.description')}</p>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100dvh-12rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur sm:h-[calc(100dvh-13rem)]">
        <AIPanel
          surface="dashboard"
          buildContext={buildContext}
          density="comfortable"
          autoFocus
          greeting={t('Assistant.greeting')}
          suggestions={[
            t('Assistant.suggest_summary'),
            t('Assistant.suggest_chart'),
            t('Assistant.suggest_scoring'),
            t('Assistant.suggest_habit'),
          ]}
        />
      </div>
    </>
  );
}
