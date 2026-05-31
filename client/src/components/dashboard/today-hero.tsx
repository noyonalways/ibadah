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

/**
 * Resolve a viewport-aware ring size. Returns a comfortable 104px on
 * tablet/desktop and shrinks to 84px on phones so the 2×2 cluster fits
 * without horizontal overflow on iPhone-SE-class devices.
 */
function useRingSize() {
  // Server / first paint default — small enough to never overflow.
  const [size, setSize] = useState(84);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setSize(mq.matches ? 104 : 84);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return size;
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
  const ringSize = useRingSize();
  const ringThickness = ringSize >= 100 ? 8 : 6;

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
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-accent/10 p-5 shadow-xl shadow-primary/5 sm:p-6 md:p-10">
      <GeometricPattern className="text-primary" opacity={0.05} />
      <div
        className="pointer-events-none absolute -right-20 -top-32 size-[380px] rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 size-[320px] rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-7 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
        {/* Greeting block */}
        <div>
          <p
            className="font-display text-xl text-primary/80 sm:text-2xl dark:text-primary/90"
            dir="rtl"
            lang="ar"
          >
            {arabic}
          </p>
          <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {greeting},{' '}
            <span className="text-gradient">{name || t('friend')}</span>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            {today} · {hint}
          </p>

          <div className="mt-5 inline-flex max-w-full items-center gap-2.5 rounded-full border border-border/70 bg-background/80 px-3.5 py-1.5 backdrop-blur sm:mt-6 sm:px-4 sm:py-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-accent-foreground sm:size-7">
              <Sparkles className="size-3 sm:size-3.5" />
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline sm:text-xs">
              {t('today')}
            </span>
            <span className="text-sm font-semibold tabular-nums sm:text-base">
              {totalPoints > 0 ? '+' : ''}
              {totalPoints} pts
            </span>
          </div>
        </div>

        {/* Rings cluster — 2×2 on phones, single row on tablet+ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {rings.map((r) => (
            <div key={r.label} className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2">
              <ProgressRing
                value={r.value}
                max={r.max}
                size={ringSize}
                thickness={ringThickness}
                label={`${Math.round((r.value / Math.max(r.max, 1)) * 100)}%`}
                gradientFrom={r.gradientFrom}
                gradientTo={r.gradientTo}
              />
              <span className="truncate text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px] sm:tracking-[0.2em]">
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
