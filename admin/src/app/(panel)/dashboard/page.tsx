'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Flame,
  HandHeart,
  ListChecks,
  ListTodo,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard, ChartBadge } from '@/components/admin/charts/chart-card';
import { TimeSeriesChart } from '@/components/admin/charts/time-series-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { systemApi } from '@/lib/admin-api';
import { useCurrentAdmin } from '@/hooks/use-auth';
import { formatRelative } from '@/lib/utils';

/**
 * Single-screen operator overview. Pulls a pre-aggregated snapshot via
 * `/admin/dashboard` (one round-trip), then renders:
 *
 *   1. Server-health strip (uptime, DB state)
 *   2. KPI tiles (users / active / signups / total points)
 *   3. Moderation summary + recent audit summary side-by-side
 *   4. 30-day engagement chart (DAU + total points)
 *   5. Top operators of the past 7 days
 *
 * Each card deep-links to the page that owns its data, so the dashboard
 * is intentionally a navigation surface rather than the place to act.
 */
export default function AdminDashboardPage() {
  const { user } = useCurrentAdmin();

  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: systemApi.dashboard,
    refetchInterval: 60_000,
  });

  const data = dashboard.data;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={`Hello, ${user?.name?.split(' ')[0] ?? 'Operator'}`}
        description="A live snapshot of system health, user activity, content volume, moderation queue and recent privileged actions."
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
                {dashboard.isLoading
                  ? 'Checking…'
                  : dashboard.isError
                    ? 'Unreachable'
                    : `Status ${data?.health.status} · uptime ${formatUptime(data?.health.uptime ?? 0)} · DB ${data?.health.db.state}`}
              </p>
            </div>
          </div>
          <Badge
            variant={
              dashboard.isError
                ? 'destructive'
                : dashboard.isLoading
                  ? 'secondary'
                  : data?.health.status === 'ok'
                    ? 'success'
                    : 'warning'
            }
            className="self-start sm:self-auto"
          >
            {dashboard.isError
              ? 'down'
              : dashboard.isLoading
                ? 'pending'
                : (data?.health.status ?? 'unknown')}
          </Badge>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total users"
          value={data?.metrics.users.total ?? '—'}
          sublabel={`${data?.metrics.users.newLast7d ?? 0} new this week`}
          tone="primary"
        />
        <StatCard
          icon={UserCheck}
          label="Active · 7d"
          value={data?.metrics.active.wau ?? '—'}
          sublabel={`${data?.metrics.active.dau ?? 0} active today`}
          tone="accent"
        />
        <StatCard
          icon={Sparkles}
          label="Signups · 30d"
          value={data?.metrics.users.newLast30d ?? '—'}
          sublabel="new accounts"
          tone="tertiary"
        />
        <StatCard
          icon={TrendingUp}
          label="Total points"
          value={
            data
              ? (
                  data.analytics.pillars.salah.totalPoints +
                  data.analytics.pillars.habits.totalPoints +
                  data.analytics.pillars.checklist.totalPoints
                ).toLocaleString()
              : '—'
          }
          sublabel={`across ${data?.analytics.range.days ?? 0} days`}
          tone="primary"
        />
      </div>

      {/* Moderation + Audit summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" /> Moderation queue
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/moderation">
                Open <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Tile
                    label="Pending"
                    value={data.moderation.pending}
                    icon={AlertTriangle}
                    tone="amber"
                  />
                  <Tile
                    label="Approved"
                    value={data.moderation.approved}
                    icon={CheckCircle2}
                    tone="emerald"
                  />
                  <Tile
                    label="Hidden"
                    value={data.moderation.hidden}
                    icon={ShieldCheck}
                    tone="muted"
                  />
                  <Tile
                    label="Removed"
                    value={data.moderation.removed}
                    icon={AlertTriangle}
                    tone="red"
                  />
                </div>
                <ul className="mt-4 grid gap-1.5 text-xs sm:grid-cols-3">
                  <BreakdownRow
                    icon={ListChecks}
                    label="Habits"
                    value={data.moderation.pendingByType.habit}
                  />
                  <BreakdownRow
                    icon={ListTodo}
                    label="Checklist"
                    value={data.moderation.pendingByType.checklist_item}
                  />
                  <BreakdownRow
                    icon={HandHeart}
                    label="Dhikr"
                    value={data.moderation.pendingByType.dhikr}
                  />
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" /> Recent audit
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/audit">
                Open <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data ? (
              <>
                <p className="text-sm">
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {data.audit.total}
                  </span>{' '}
                  <span className="text-xs text-muted-foreground">
                    privileged actions in the last 7 days
                  </span>
                </p>
                {data.audit.byAction.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {data.audit.byAction.slice(0, 5).map((a) => (
                      <li
                        key={a.action}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono">
                          {a.action}
                        </span>
                        <span className="font-medium tabular-nums">
                          {a.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No actions recorded yet.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement trend */}
      <ChartCard
        title="Engagement — last 30 days"
        description="Daily active users (distinct authenticated users with worship logged) and total points across all pillars."
        badge={
          data ? <ChartBadge>{data.analytics.range.days} days</ChartBadge> : undefined
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
        {!data ? (
          <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <TimeSeriesChart
            data={data.analytics.daily}
            height={240}
            series={[
              { key: 'activeUsers', label: 'Active users', color: 'primary' },
              { key: 'totalPoints', label: 'Total points', color: 'accent-deep' },
            ]}
          />
        )}
      </ChartCard>

      {/* Top moderators / top actors */}
      {data && data.audit.byActor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 text-primary" /> Top operators · last 7 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {data.audit.byActor.slice(0, 5).map((a) => (
                <li
                  key={a.email}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 p-2"
                >
                  <Avatar src={undefined} name={a.name} size={28} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{a.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {a.count} actions
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data && (
        <p className="text-right text-[10px] text-muted-foreground">
          Generated {formatRelative(data.generatedAt)}
        </p>
      )}
    </>
  );
}

function Tile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  tone: 'amber' | 'emerald' | 'muted' | 'red';
}) {
  const toneCls =
    tone === 'amber'
      ? 'text-amber-700 dark:text-amber-300 bg-amber-500/10'
      : tone === 'emerald'
        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
        : tone === 'red'
          ? 'text-destructive bg-destructive/10'
          : 'text-muted-foreground bg-muted/30';
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 p-2 text-center">
      <div
        className={`mx-auto mb-1 grid size-7 place-items-center rounded-md ${toneCls}`}
      >
        <Icon className="size-3.5" />
      </div>
      <p className="font-display text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function BreakdownRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListChecks;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border/40 bg-card/40 px-2 py-1">
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3 text-muted-foreground" />
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </li>
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
