'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpen,
  HandHeart,
  Heart,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard, ChartBadge } from '@/components/admin/charts/chart-card';
import { TimeSeriesChart } from '@/components/admin/charts/time-series-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  activeUsersApi,
  adminHealthApi,
  analyticsApi,
  leaderboardApi,
  metricsApi,
  type LeaderboardEntry,
  type UserSummary,
} from '@/lib/admin-api';
import { cn, formatRelative } from '@/lib/utils';

export default function AdminDashboardPage() {
  const metrics = useQuery({ queryKey: ['admin', 'metrics'], queryFn: metricsApi.get });
  const health = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: adminHealthApi.get,
    refetchInterval: 30_000,
  });
  const top = useQuery({
    queryKey: ['admin', 'leaderboard', 'preview'],
    queryFn: () => leaderboardApi.fetch({ limit: 5 }),
  });
  const recent = useQuery({
    queryKey: ['admin', 'active-users', 'preview'],
    queryFn: () => activeUsersApi.fetch({ days: 7, limit: 6 }),
  });

  // Mini 14-day engagement strip — gives the operator a "is the app
  // healthy and active?" gut-check on the home screen, without making
  // them navigate to /analytics.
  const recent14 = useQuery({
    queryKey: ['admin', 'analytics', 'overview', '14d'],
    queryFn: () => analyticsApi.overview({}),
  });

  const m = metrics.data;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Operations dashboard"
        description="A live snapshot of the application — who's using it, how much, and whether the system is healthy."
        actions={<HealthPill health={health.data?.status} db={health.data?.db.state} />}
      />

      {/* Top metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total users"
          value={m ? m.users.total : '—'}
          sublabel={
            m
              ? `${m.users.admins} admin · ${m.users.suspended} suspended`
              : 'fetching…'
          }
          tone="primary"
        />
        <StatCard
          icon={UserCheck}
          label="Active (7 days)"
          value={m ? m.active.wau : '—'}
          sublabel={m ? `${m.active.dau} today · ${m.active.mau} this month` : ''}
          tone="accent"
        />
        <StatCard
          icon={UserPlus}
          label="New (7 days)"
          value={m ? `+${m.users.newLast7d}` : '—'}
          sublabel={m ? `${m.users.newLast30d} in last 30 days` : ''}
          tone="tertiary"
        />
        <StatCard
          icon={TrendingUp}
          label="Engagement"
          value={
            m && m.users.total > 0
              ? `${Math.round((m.active.wau / m.users.total) * 100)}%`
              : '—'
          }
          sublabel="WAU / total"
          tone="primary"
        />
      </div>

      {/* Two-column body */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Leaderboard preview (2 cols on lg) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-4 text-accent-deep" />
                Top users · last 30 days
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Cumulative score across salah, habits and checklist.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/leaderboard">
                Open leaderboard
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {top.isLoading && <SkeletonList n={5} />}
            {top.data && top.data.length === 0 && (
              <EmptyState
                icon={Trophy}
                title="No activity yet"
                description="As soon as users start logging worship, the leaderboard will populate."
              />
            )}
            {top.data && top.data.length > 0 && (
              <ol className="space-y-2">
                {top.data.map((entry, idx) => (
                  <LeaderboardRow key={entry.user.id} rank={idx + 1} entry={entry} />
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Right rail: recent active users + content split */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Recently active
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Users seen in the last 7 days.
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recent.isLoading && <SkeletonList n={4} />}
              {recent.data && recent.data.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                  No recent activity yet.
                </p>
              )}
              {recent.data?.map((u) => <ActiveUserRow key={u.id} user={u} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-tertiary" />
                Content footprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                <Footprint label="Salah days" value={m?.content.salahDays} icon={Heart} />
                <Footprint
                  label="Quran pages"
                  value={m?.content.totalQuranPages}
                  icon={BookOpen}
                />
                <Footprint label="Habit days" value={m?.content.habitDays} icon={HandHeart} />
                <Footprint
                  label="Checklist days"
                  value={m?.content.checklistDays}
                  icon={UserCheck}
                />
                <Footprint label="Dhikr days" value={m?.content.dhikrDays} icon={Sparkles} />
              </ul>
            </CardContent>
          </Card>
        </div>
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

function HealthPill({
  health,
  db,
}: {
  health: 'ok' | 'degraded' | 'down' | undefined;
  db: 'connected' | 'connecting' | 'disconnected' | 'unknown' | undefined;
}) {
  const tone =
    health === 'ok' ? 'success' : health === 'degraded' ? 'warning' : 'destructive';
  const label = health === 'ok' ? 'Online' : health === 'degraded' ? 'Degraded' : 'Down';
  return (
    <Badge variant={tone} className="gap-1.5">
      <span
        className={cn(
          'inline-block size-1.5 rounded-full animate-pulse',
          health === 'ok' ? 'bg-emerald-500' : health === 'degraded' ? 'bg-amber-500' : 'bg-destructive',
        )}
      />
      {label}
      {db && db !== 'connected' && <span className="ml-1 opacity-70">· db: {db}</span>}
    </Badge>
  );
}

function LeaderboardRow({ rank, entry }: { rank: number; entry: LeaderboardEntry }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3">
      <RankBadge rank={rank} />
      <Avatar src={entry.user.avatarUrl} name={entry.user.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.user.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{entry.user.email}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{entry.totalPoints}</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">pts</p>
      </div>
    </li>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tones: Record<number, string> = {
    1: 'bg-gradient-to-br from-accent to-accent-deep text-accent-foreground',
    2: 'bg-gradient-to-br from-muted to-muted-foreground/40 text-foreground',
    3: 'bg-gradient-to-br from-primary/30 to-primary/15 text-primary',
  };
  return (
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full font-display text-xs font-semibold tabular-nums',
        tones[rank] ?? 'bg-muted/60 text-muted-foreground',
      )}
    >
      {rank}
    </span>
  );
}

function ActiveUserRow({ user }: { user: UserSummary }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={user.avatarUrl} name={user.name} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {formatRelative(user.lastActiveAt)}
        </p>
      </div>
      {user.role === 'admin' && (
        <Badge variant="success" className="text-[9px]">
          admin
        </Badge>
      )}
    </div>
  );
}

function Footprint({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Heart;
}) {
  return (
    <li className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value ?? '—'}</span>
    </li>
  );
}

function SkeletonList({ n }: { n: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-xl border border-border/40 bg-muted/30"
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Trophy;
  title: string;
  description: string;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
      <Icon className="mb-2 size-6 text-muted-foreground/60" />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
