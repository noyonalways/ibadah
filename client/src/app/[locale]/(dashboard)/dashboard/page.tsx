'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Flame, TrendingUp, Trophy, CalendarRange } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-auth';
import { statsApi } from '@/lib/stats-api';
import { toDayKey } from '@/lib/utils';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const { user } = useCurrentUser();

  // Last 7 days range
  const today = toDayKey(new Date());
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toDayKey(d);
  })();

  const streaks = useQuery({
    queryKey: ['stats', 'streaks'],
    queryFn: statsApi.streaks,
  });

  const weekly = useQuery({
    queryKey: ['stats', 'daily', weekAgo, today],
    queryFn: () => statsApi.daily(weekAgo, today),
  });

  const weeklyTotal = (weekly.data ?? []).reduce((sum, d) => sum + d.total, 0);
  const todayPoints = (weekly.data ?? []).find((d) => d.date === today)?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('greeting', { name: user?.name?.split(' ')[0] ?? 'friend' })}
        description="Here's your worship at a glance."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          title={t('todaysProgress')}
          value={todayPoints.toString()}
          tone="primary"
        />
        <StatCard
          icon={Flame}
          title={t('currentStreak')}
          value={`${streaks.data?.current ?? 0} ${t('days')}`}
          tone="accent"
        />
        <StatCard
          icon={Trophy}
          title={t('longestStreak')}
          value={`${streaks.data?.longest ?? 0} ${t('days')}`}
          tone="primary"
        />
        <StatCard
          icon={CalendarRange}
          title={t('weeklyPoints')}
          value={weeklyTotal.toString()}
          tone="primary"
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {(weekly.data ?? []).map((d) => {
                const intensity =
                  d.total <= 0 ? 'bg-muted' : d.total < 30 ? 'bg-primary/30' : d.total < 80 ? 'bg-primary/60' : 'bg-primary';
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.total} pts`}
                    className={`aspect-square rounded-md ${intensity}`}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Each cell represents a day's total points across modules.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>• Log today's prayers in the Salah tab.</p>
            <p>• Set your default dhikr targets in Settings.</p>
            <p>• Define custom habits and earn reward points.</p>
            <p>• Use the date picker on each tracker to back-fill past days.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: typeof Flame;
  title: string;
  value: string;
  tone: 'primary' | 'accent';
}) {
  const toneClasses =
    tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/30 text-accent-foreground';
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid size-11 place-items-center rounded-lg ${toneClasses}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
