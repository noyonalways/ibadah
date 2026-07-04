'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ProgressRing } from '@/components/shared/progress-ring';
import { useCurrentUser } from '@/hooks/use-auth';
import { statsApi } from '@/lib/stats/stats-api';
import { salahApi, type PrayerName, type SalahDay } from '@/lib/salah/salah-api';
import { userApi } from '@/lib/user/user-api';
import { maxDailyPoints } from '@/lib/salah-scoring';
import { SALAH_DEFAULT_SCORING } from '@/lib/salah-defaults';
import { cn, toDayKey } from '@/lib/utils';

type ChipState = 'done' | 'missed' | 'pending';

interface PreviewModel {
  /** True when the card reflects the signed-in user's real data. */
  live: boolean;
  dateLabel: string;
  points: number;
  overallPct: number;
  chips: { name: PrayerName; tone: string; state: ChipState }[];
  streak: number;
  /** Seven booleans — Mon→Sun-ish window ending today. */
  week: boolean[];
}

const PRAYER_TONES: { name: PrayerName; tone: string }[] = [
  { name: 'fajr', tone: 'bg-prayer-fajr' },
  { name: 'dhuhr', tone: 'bg-prayer-dhuhr' },
  { name: 'asr', tone: 'bg-prayer-asr' },
  { name: 'maghrib', tone: 'bg-prayer-maghrib' },
  { name: 'isha', tone: 'bg-prayer-isha' },
];

/** The evergreen demo card shown to logged-out visitors. */
const DEMO_MODEL: PreviewModel = {
  live: false,
  dateLabel: "Friday, Rabi' al-Awwal",
  points: 85,
  overallPct: 82,
  chips: PRAYER_TONES.map((p) => ({ ...p, state: 'done' })),
  streak: 14,
  week: [true, true, true, true, true, false, false],
};

function chipState(day: SalahDay | undefined, name: PrayerName): ChipState {
  if (!day) return 'pending';
  const status =
    day.isFriday && name === 'dhuhr'
      ? day.jummah?.fard.status ?? 'pending'
      : day.prayers[name].fard.status;
  if (status === 'missed') return 'missed';
  if (status === 'pending') return 'pending';
  return 'done';
}

/**
 * Landing hero card. For signed-in visitors it mirrors today's real
 * progress (overall completion, prayer chips, points and streak) so the
 * marketing page doubles as a quick glance at their day. For everyone
 * else it shows an evergreen demo so the page still tells a story.
 */
export function HeroPreview() {
  const { user, hasHydrated } = useCurrentUser();
  const authed = hasHydrated && !!user;

  const today = toDayKey(new Date());
  const weekAgo = toDayKey(
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return d;
    })(),
  );

  // All queries reuse the dashboard's cache keys, so navigating between
  // the landing page and the app costs no extra network round-trips.
  const weekQ = useQuery({
    queryKey: ['stats', 'daily', weekAgo, today],
    queryFn: () => statsApi.daily(weekAgo, today),
    enabled: authed,
  });
  const streaksQ = useQuery({
    queryKey: ['stats', 'streaks'],
    queryFn: statsApi.streaks,
    enabled: authed,
  });
  const salahQ = useQuery({
    queryKey: ['salah', 'day', today],
    queryFn: () => salahApi.getDay(today),
    enabled: authed,
  });
  const profileQ = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userApi.getMe,
    enabled: authed,
    staleTime: 30_000,
  });

  let model: PreviewModel = DEMO_MODEL;

  if (authed) {
    const wk = weekQ.data ?? [];
    const todayBreak = wk.find((d) => d.date === today);
    const isFriday = new Date().getDay() === 5;
    const scoring = profileQ.data?.scoring ?? SALAH_DEFAULT_SCORING;
    const salahMax = maxDailyPoints(scoring, isFriday);

    const ratios = [
      (todayBreak?.salah ?? 0) / Math.max(salahMax, 1),
      (todayBreak?.quranPages ?? 0) / 10,
      (todayBreak?.habit ?? 0) / 50,
      (todayBreak?.checklist ?? 0) / 50,
    ].map((r) => Math.max(0, Math.min(1, r)));
    const overallPct = Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);

    const week = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return (wk.find((x) => x.date === toDayKey(d))?.total ?? 0) > 0;
    });

    model = {
      live: true,
      dateLabel: new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      points: todayBreak?.total ?? 0,
      overallPct,
      chips: PRAYER_TONES.map((p) => ({ ...p, state: chipState(salahQ.data, p.name) })),
      streak: streaksQ.data?.current ?? 0,
      week,
    };
  }

  return <PreviewCard model={model} />;
}

function PreviewCard({ model }: { model: PreviewModel }) {
  const t = useTranslations('Landing');
  const tSalah = useTranslations('Salah');

  return (
    <div className="relative overflow-hidden">
      {/* Decorative glow — clipped by overflow-hidden so blur never widens the page */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-[1.75rem] bg-gradient-to-br from-primary/30 via-tertiary/15 to-accent/30 blur-3xl"
        aria-hidden
      />

      {/* Halo ring */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-[1.75rem] bg-gradient-to-br from-primary/40 via-transparent to-accent/40 opacity-60 blur-2xl animate-breathe-slow"
        aria-hidden
      />

      <div className="glass-card relative overflow-hidden rounded-[1.75rem] p-4 sm:p-6 md:p-8">
        {/* Top row */}
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {model.live ? t('preview_welcomeBack') : t('preview_today')}
            </p>
            <p className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-2xl">
              {model.dateLabel}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground sm:px-3">
            {model.points > 0 ? '+' : ''}
            {model.points} pts
          </span>
        </div>

        {/* Rings cluster */}
        <div className="mt-6 flex items-center justify-center sm:mt-8">
          <ProgressRing
            value={model.overallPct}
            max={100}
            size={130}
            thickness={10}
            label={`${model.overallPct}%`}
            sublabel={t('preview_overall')}
          />
        </div>

        {/* Mini prayer chips */}
        <div className="mt-5 grid grid-cols-5 gap-1 sm:mt-6 sm:gap-1.5">
          {model.chips.map((p) => (
            <div
              key={p.name}
              className={cn(
                'relative aspect-[3/4] min-w-0 overflow-hidden rounded-lg p-1 text-[9px] font-medium text-white/95 transition-opacity sm:p-2 sm:text-[10px]',
                p.tone,
                p.state === 'pending' && 'opacity-50',
              )}
            >
              <span className="absolute inset-x-0 bottom-1 truncate text-center tracking-wide sm:bottom-1.5">
                {tSalah(p.name)}
              </span>
              <span
                className={cn(
                  'absolute right-1.5 top-1.5 size-1.5 rounded-full',
                  p.state === 'done' && 'bg-white/90',
                  p.state === 'missed' && 'bg-red-300',
                  p.state === 'pending' && 'bg-white/30',
                )}
              />
            </div>
          ))}
        </div>

        {/* Streak strip */}
        <div className="mt-5 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-3 sm:mt-6 sm:gap-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-deep text-accent-foreground shadow-sm sm:size-9">
              <span className="text-sm font-bold">{model.streak}</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-none">{t('preview_streak')}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{t('preview_keep')} ✨</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5 sm:gap-1">
            {model.week.map((active, i) => (
              <span
                key={i}
                className={cn('h-5 w-1 rounded-full sm:h-6 sm:w-1.5', active ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
