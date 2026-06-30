'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ProgressRing } from '@/components/shared/progress-ring';
import { useCurrentUser } from '@/hooks/use-auth';
import { statsApi } from '@/lib/stats-api';
import { salahApi, type PrayerName, type SalahDay } from '@/lib/salah-api';
import { userApi } from '@/lib/user-api';
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
    <div className="relative">
      {/* Decorative glow */}
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/30 via-tertiary/15 to-accent/30 blur-3xl" />

      {/* Halo ring */}
      <div
        className="absolute -inset-1 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/40 via-transparent to-accent/40 opacity-60 blur-2xl animate-breathe-slow"
        aria-hidden
      />

      <div className="glass-card relative overflow-hidden rounded-[1.75rem] p-6 md:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {model.live ? t('preview_welcomeBack') : t('preview_today')}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{model.dateLabel}</p>
          </div>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
            {model.points > 0 ? '+' : ''}
            {model.points} pts
          </span>
        </div>

        {/* Rings cluster */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <ProgressRing
            value={model.overallPct}
            max={100}
            size={150}
            thickness={11}
            label={`${model.overallPct}%`}
            sublabel={t('preview_overall')}
          />
        </div>

        {/* Mini prayer chips */}
        <div className="mt-6 grid grid-cols-5 gap-1.5">
          {model.chips.map((p) => (
            <div
              key={p.name}
              className={cn(
                'relative aspect-[3/4] overflow-hidden rounded-lg p-2 text-[10px] font-medium text-white/95 transition-opacity',
                p.tone,
                p.state === 'pending' && 'opacity-50',
              )}
            >
              <span className="absolute inset-x-0 bottom-1.5 text-center tracking-wide">
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
        <div className="mt-6 flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-deep text-accent-foreground shadow-sm">
              <span className="text-sm font-bold">{model.streak}</span>
            </span>
            <div>
              <p className="text-sm font-medium leading-none">{t('preview_streak')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('preview_keep')} ✨</p>
            </div>
          </div>
          <div className="flex gap-1">
            {model.week.map((active, i) => (
              <span
                key={i}
                className={cn('h-6 w-1.5 rounded-full', active ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
