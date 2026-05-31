'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarRange, Flame, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { TodayHero } from '@/components/dashboard/today-hero';
import { StreakCard } from '@/components/dashboard/streak-card';
import { QuoteCard } from '@/components/dashboard/quote-card';
import { ActivityHeatmap } from '@/components/dashboard/heatmap';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WeeklyChart } from '@/components/dashboard/weekly-chart';
import { MonthlyPointsChart } from '@/components/dashboard/monthly-points-chart';
import { PillarsMix } from '@/components/dashboard/pillars-mix';
import { WeekdayBars } from '@/components/dashboard/weekday-bars';
import { NegativePointsChart } from '@/components/dashboard/negative-points-chart';
import { useCurrentUser } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-user';
import { statsApi } from '@/lib/stats-api';
import { toDayKey } from '@/lib/utils';
import { maxDailyPoints } from '@/lib/salah-scoring';
import { SALAH_DEFAULT_SCORING } from '@/lib/salah-defaults';

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const { data: profile } = useProfile();

  // Last 70 days for the heatmap
  const today = toDayKey(new Date());
  const tenWeeksAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 70 + 1);
    return toDayKey(d);
  })();
  const sevenDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toDayKey(d);
  })();

  const streaks = useQuery({
    queryKey: ['stats', 'streaks'],
    queryFn: statsApi.streaks,
  });

  const heatmap = useQuery({
    queryKey: ['stats', 'daily', tenWeeksAgo, today],
    queryFn: () => statsApi.daily(tenWeeksAgo, today),
  });

  // Derived
  const allDays = heatmap.data ?? [];
  const todayPoints = allDays.find((d) => d.date === today)?.total ?? 0;
  const weekDays = allDays.filter((d) => d.date >= sevenDaysAgo);
  const weeklyTotal = weekDays.reduce((sum, d) => sum + d.total, 0);

  // Compute "rings" — proportional to today's contributions per pillar.
  // The Salah max is derived from the user's current scoring config and
  // whether today is a Friday (Jummah day yields a much higher ceiling).
  const todayBreak = allDays.find((d) => d.date === today);
  const isFriday = new Date(`${today}T00:00:00Z`).getUTCDay() === 5;
  const salahMax = maxDailyPoints(profile?.scoring ?? SALAH_DEFAULT_SCORING, isFriday);
  const rings = [
    {
      label: 'Salah',
      value: todayBreak?.salah ?? 0,
      max: salahMax,
      gradientFrom: 'var(--primary)',
      gradientTo: 'var(--primary-soft)',
    },
    {
      label: 'Quran',
      value: todayBreak?.quranPages ?? 0,
      max: 10,
      gradientFrom: 'var(--accent)',
      gradientTo: 'var(--accent-deep)',
    },
    {
      label: 'Habits',
      value: todayBreak?.habit ?? 0,
      max: 50,
      gradientFrom: 'var(--tertiary)',
      gradientTo: 'var(--primary-soft)',
    },
    {
      label: 'Tasks',
      value: todayBreak?.checklist ?? 0,
      max: 50,
      gradientFrom: 'var(--accent-deep)',
      gradientTo: 'var(--primary)',
    },
  ];

  return (
    <>
      <TodayHero
        name={user?.name?.split(' ')[0] ?? 'friend'}
        rings={rings}
        totalPoints={todayPoints}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StreakCard
          current={streaks.data?.current ?? 0}
          longest={streaks.data?.longest ?? 0}
        />
        <MiniStat
          icon={TrendingUp}
          label="This week"
          value={`${weeklyTotal > 0 ? '+' : ''}${weeklyTotal}`}
          tone="primary"
          sublabel="points across all pillars"
        />
        <MiniStat
          icon={CalendarRange}
          label="Active days"
          value={`${weekDays.filter((d) => d.total > 0).length}/7`}
          tone="accent"
          sublabel="this week"
        />
      </div>

      <WeeklyChart days={allDays} />

      {/* 30-day total-points view — shows positive earnings and salah
          penalties as opposing bars around y=0, with a cumulative net
          line. Reuses the same heatmap query, so no extra fetch. */}
      <MonthlyPointsChart days={allDays} />

      {/* Salah-points balance — surfaces negative-day penalties from
          missed Fard prayers as a separate signed bar chart. Derives
          from the same heatmap query so no extra fetch. */}
      <NegativePointsChart days={allDays} />

      {/* New analytical row — pillars share + weekday strength. Both
          charts derive from the heatmap query, so no additional fetch. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PillarsMix days={allDays} from={sevenDaysAgo} />
        <WeekdayBars days={allDays} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ActivityHeatmap days={allDays} />
          <QuoteCard />
        </div>
        <QuickActions />
      </div>
    </>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sublabel: string;
  tone: 'primary' | 'accent';
}) {
  const toneClass =
    tone === 'primary'
      ? 'from-primary/15 via-card to-card text-primary'
      : 'from-accent/15 via-card to-card text-accent-foreground';

  return (
    <Card className={`relative overflow-hidden border-border/60 bg-gradient-to-br ${toneClass}`}>
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-12 ${tone === 'primary' ? 'bg-primary/15' : 'bg-accent/30'}`}
        >
          <Icon className="size-4 sm:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xl font-bold tracking-tight tabular-nums text-foreground sm:text-2xl">
            {value}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
