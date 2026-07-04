'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ProgressRing } from '@/components/shared/progress-ring';
import { LandingCard } from '@/components/landing/landing-card';
import { useCurrentUser } from '@/hooks/use-auth';
import { statsApi } from '@/lib/stats/stats-api';
import { salahApi, type PrayerName, type SalahDay } from '@/lib/salah/salah-api';
import { userApi } from '@/lib/user/user-api';
import { maxDailyPoints } from '@/lib/salah-scoring';
import { SALAH_DEFAULT_SCORING } from '@/lib/salah-defaults';
import { cn, toDayKey } from '@/lib/utils';

type ChipState = 'done' | 'missed' | 'pending';

interface PreviewModel {
  live: boolean;
  dateLabel: string;
  points: number;
  overallPct: number;
  chips: { name: PrayerName; tone: string; state: ChipState }[];
  streak: number;
  week: boolean[];
}

const PRAYER_TONES: { name: PrayerName; tone: string }[] = [
  { name: 'fajr', tone: 'bg-prayer-fajr' },
  { name: 'dhuhr', tone: 'bg-prayer-dhuhr' },
  { name: 'asr', tone: 'bg-prayer-asr' },
  { name: 'maghrib', tone: 'bg-prayer-maghrib' },
  { name: 'isha', tone: 'bg-prayer-isha' },
];

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
    <LandingCard interactive={false} className="p-0 shadow-lg shadow-primary/5">
      <div className="p-6 md:p-7">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {model.live ? t('preview_welcomeBack') : t('preview_today')}
            </p>
            <p className="mt-1 truncate text-lg font-semibold tracking-tight">{model.dateLabel}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium">
            {model.points > 0 ? '+' : ''}
            {model.points} pts
          </span>
        </div>

        <div className="mt-7 flex items-center justify-center">
          <ProgressRing
            value={model.overallPct}
            max={100}
            size={128}
            thickness={10}
            label={`${model.overallPct}%`}
            sublabel={t('preview_overall')}
          />
        </div>

        <div className="mt-6 grid grid-cols-5 gap-1.5">
          {model.chips.map((p) => (
            <div
              key={p.name}
              className={cn(
                'relative aspect-[3/4] min-w-0 overflow-hidden rounded-lg p-1 text-[9px] font-medium text-white/95 sm:text-[10px]',
                p.tone,
                p.state === 'pending' && 'opacity-50',
              )}
            >
              <span className="absolute inset-x-0 bottom-1 truncate text-center tracking-wide">
                {tSalah(p.name)}
              </span>
              <span
                className={cn(
                  'absolute right-1 top-1 size-1.5 rounded-full',
                  p.state === 'done' && 'bg-white/90',
                  p.state === 'missed' && 'bg-red-300',
                  p.state === 'pending' && 'bg-white/30',
                )}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {model.streak}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-none">{t('preview_streak')}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{t('preview_keep')}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {model.week.map((active, i) => (
              <span
                key={i}
                className={cn('h-5 w-1 rounded-full', active ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
        </div>
      </div>
    </LandingCard>
  );
}
