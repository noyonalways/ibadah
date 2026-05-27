'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { ProgressRing } from '@/components/shared/progress-ring';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

interface RingData {
  label: string;
  value: number;
  max: number;
  gradientFrom: string;
  gradientTo: string;
}

type TimeOfDayKey = 'morning' | 'afternoon' | 'evening' | 'night' | 'peaceful' | 'welcome';

function timeOfDayKey(): TimeOfDayKey {
  const h = new Date().getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 20) return 'evening';
  return 'peaceful';
}

export function TodayHero({
  name,
  rings,
  totalPoints,
}: {
  name: string;
  rings: RingData[];
  totalPoints: number;
}) {
  const t = useTranslations('Dashboard');

  // Rendered on the client to avoid hydration drift on time-of-day.
  const [todKey, setTodKey] = useState<TimeOfDayKey>('welcome');
  useEffect(() => setTodKey(timeOfDayKey()), []);

  const greeting = t(`greeting_${todKey}`);
  const arabic = t(`greeting_${todKey}_ar`);
  const hint = t(`greeting_${todKey}_hint`);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-accent/10 p-6 shadow-xl shadow-primary/5 md:p-10">
      <GeometricPattern className="text-primary" opacity={0.05} />
      <div
        className="pointer-events-none absolute -right-20 -top-32 size-[380px] rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 size-[320px] rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
        {/* Greeting block */}
        <div>
          <p
            className="font-display text-2xl text-primary/80 dark:text-primary/90"
            dir="rtl"
            lang="ar"
          >
            {arabic}
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {greeting},{' '}
            <span className="text-gradient">{name || t('friend')}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {today} · {hint}
          </p>

          <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-background/80 px-4 py-2 backdrop-blur">
            <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-accent-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t('today')}
            </span>
            <span className="text-base font-semibold tabular-nums">
              {totalPoints > 0 ? '+' : ''}
              {totalPoints} pts
            </span>
          </div>
        </div>

        {/* Rings cluster */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {rings.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <ProgressRing
                value={r.value}
                max={r.max}
                size={104}
                thickness={8}
                label={`${Math.round((r.value / Math.max(r.max, 1)) * 100)}%`}
                gradientFrom={r.gradientFrom}
                gradientTo={r.gradientTo}
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
