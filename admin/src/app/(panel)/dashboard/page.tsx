'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  CalendarRange,
  Flame,
  HandHeart,
  ListChecks,
  ListTodo,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard, ChartBadge } from '@/components/admin/charts/chart-card';
import { TimeSeriesChart } from '@/components/admin/charts/time-series-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { analyticsApi, statsApi } from '@/lib/admin-api';
import { useCurrentAdmin } from '@/hooks/use-auth';
import { fetchHealth } from '@/lib/api';
import { toDayKey } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user } = useCurrentAdmin();

  const today = toDayKey(new Date());
  const sevenDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toDayKey(d);
  })();
  const thirtyDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toDayKey(d);
  })();

  const streaks = useQuery({ queryKey: ['admin', 'streaks'], queryFn: statsApi.streaks });
  const month = useQuery({
    queryKey: ['admin', 'daily', thirtyDaysAgo, today],
    queryFn: () => statsApi.daily(thirtyDaysAgo, today),
  });
  const health = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  // Mini 14-day engagement strip — gives the operator a "is the app
  // healthy and active?" gut-check on the home screen, without making
  // them navigate to /analytics.
  const recent14 = useQuery({
    queryKey: ['admin', 'analytics', 'overview', '14d'],
    queryFn: () => analyticsApi.overview({}),
  });

  const monthDays = month.data ?? [];
  const monthlyTotal = monthDays.reduce((s, d) => s + d.total, 0);
  const weekDays = monthDays.filter((d) => d.date >= sevenDaysAgo);
  const weeklyTotal = weekDays.reduce((s, d) => s + d.total, 0);
  const activeWeek = weekDays.filter((d) => d.total > 0).length;

  // Pillar split for the last 7 days — used by the breakdown card.
  const breakdown = weekDays.reduce(
    (acc, d) => {
      acc.salah += d.salah;
      acc.habit += d.habit;
      acc.checklist += d.checklist;
      acc.quran += d.quranPages;
      return acc;
    },
    { salah: 0, habit: 0, checklist: 0, quran: 0 },
  );
  const pillarTotal = breakdown.salah + breakdown.habit + breakdown.checklist;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={`Hello, ${user?.name?.split(' ')[0] ?? 'Operator'}`}
        description="A snapshot of the application's pulse, the operator's recent activity, and the server health right now."
      />

      {/* System health strip */}
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/8 via-card to-card">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Server health
              </p>
              <p className="text-sm font-medium">
                {health.isLoading
                  ? 'Checking…'
                  : health.isError
                    ? 'Unreachable'
                    : `Status ${health.data?.status} · uptime ${formatUptime(health.data?.uptime ?? 0)}`}
              </p>
            </div>
          </div>
          <Badge
            variant={
              health.isError ? 'destructive' : health.isLoading ? 'secondary' : 'success'
            }
            className="self-start sm:self-auto"
          >
            {health.isError ? 'down' : health.isLoading ? 'pending' : 'online'}
          </Badge>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={streaks.data?.current ?? 0}
          sublabel={`Longest ${streaks.data?.longest ?? 0} days`}
          tone="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="This week"
          value={`${weeklyTotal > 0 ? '+' : ''}${weeklyTotal}`}
          sublabel="points across all pillars"
          tone="accent"
        />
        <StatCard
          icon={CalendarRange}
          label="Active days"
          value={`${activeWeek}/7`}
          sublabel="logged at least one entry"
          tone="tertiary"
        />
        <StatCard
          icon={Users}
          label="Total users"
          value="—"
          sublabel="needs /admin/users"
          tone="primary"
        />
      </div>

      {/* Pillar breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Pillar mix · last 7 days</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Where the operator&apos;s points are coming from.
              </p>
            </div>
            <Badge variant="outline">{pillarTotal} pts</Badge>
          </CardHeader>
          <CardContent>
            <PillarBars
              rows={[
                {
                  label: 'Salah',
                  value: breakdown.salah,
                  total: pillarTotal,
                  icon: ShieldCheck,
                  color: 'var(--primary)',
                },
                {
                  label: 'Habits',
                  value: breakdown.habit,
                  total: pillarTotal,
                  icon: ListChecks,
                  color: 'var(--accent-deep)',
                },
                {
                  label: 'Checklist',
                  value: breakdown.checklist,
                  total: pillarTotal,
                  icon: ListTodo,
                  color: 'var(--tertiary)',
                },
                {
                  label: 'Quran (pages)',
                  value: breakdown.quran,
                  total: Math.max(breakdown.quran, 1),
                  icon: HandHeart,
                  color: 'var(--primary-soft)',
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly total</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Last 30 days across salah, habits, and checklist.
            </p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-5xl font-bold tracking-tight tabular-nums text-gradient">
              {monthlyTotal}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {monthDays.filter((d) => d.total > 0).length} active days in window
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement trend strip — last 30 days, links to full /analytics */}
      <ChartCard
        title="Engagement — last 30 days"
        description="Daily active users (distinct users with worship logged) and total points across all pillars. For the full analytics suite, open the Analytics page."
        badge={
          recent14.data ? (
            <ChartBadge>{recent14.data.range.days} days</ChartBadge>
          ) : undefined
        }
        actions={
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/analytics">
              Open analytics
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        }
      >
        {recent14.isLoading || !recent14.data ? (
          <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <TimeSeriesChart
            data={recent14.data.daily}
            height={240}
            series={[
              { key: 'activeUsers', label: 'Active users', color: 'primary' },
              { key: 'totalPoints', label: 'Total points', color: 'accent-deep' },
            ]}
          />
        )}
      </ChartCard>
    </>
  );
}

function PillarBars({
  rows,
}: {
  rows: {
    label: string;
    value: number;
    total: number;
    icon: typeof Flame;
    color: string;
  }[];
}) {
  return (
    <ul className="space-y-3.5">
      {rows.map(({ label, value, total, icon: Icon, color }) => {
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <li key={label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <Icon className="size-3.5 text-muted-foreground" />
                {label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {value} <span className="text-[10px]">·</span> {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatUptime(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
