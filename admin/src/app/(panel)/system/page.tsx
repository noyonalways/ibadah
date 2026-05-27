'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  ServerCog,
  TrendingUp,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, fetchHealth } from '@/lib/api';
import { systemApi, type ExtendedHealth, type SystemMetrics } from '@/lib/admin-api';

export default function SystemPage() {
  const health = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: systemApi.health,
    refetchInterval: 15_000,
  });

  const metrics = useQuery({
    queryKey: ['admin', 'system', 'metrics'],
    queryFn: systemApi.metrics,
    refetchInterval: 30_000,
  });

  const publicHealth = useQuery({
    queryKey: ['admin', 'system', 'public-health'],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
  });

  const apiInfo = useQuery({
    queryKey: ['admin', 'system', 'api'],
    queryFn: () => api<{ name: string; version: string }>('/', { auth: false }),
  });

  const status = health.isError
    ? 'down'
    : health.isLoading
      ? 'pending'
      : (health.data?.status ?? 'pending');
  const statusTone =
    status === 'ok'
      ? 'primary'
      : status === 'degraded' || status === 'pending'
        ? 'tertiary'
        : 'destructive';

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System"
        description="Live operational status, infrastructure metrics and traffic counters. Auto-refreshing every 15 seconds."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={status === 'down' ? AlertTriangle : CheckCircle2}
          label="API status"
          value={status}
          sublabel={publicHealth.data?.status ?? '—'}
          tone={statusTone}
        />
        <StatCard
          icon={Activity}
          label="Uptime"
          value={
            health.data ? formatUptime(health.data.uptime) : '—'
          }
          sublabel="since last restart"
          tone="accent"
        />
        <StatCard
          icon={Database}
          label="Database"
          value={health.data?.db.state ?? '—'}
          sublabel={
            health.data?.db.latencyMs != null
              ? `${health.data.db.latencyMs}ms ping · ${health.data.db.name ?? 'mongo'}`
              : '—'
          }
          tone={
            health.data?.db.state === 'connected' ? 'primary' : 'destructive'
          }
        />
        <StatCard
          icon={Globe}
          label="API"
          value={apiInfo.data?.name ?? 'Ibadah API'}
          sublabel={apiInfo.data?.version ?? '—'}
          tone="primary"
        />
      </div>

      {/* Runtime resources */}
      <div className="grid gap-4 md:grid-cols-3">
        <ResourceCard health={health.data} />
        <UsersCard metrics={metrics.data} />
        <ContentCard metrics={metrics.data} />
      </div>

      {/* Active users (DAU/WAU/MAU) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" /> Active users
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Distinct authenticated users observed in the last 24h / 7d / 30d.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-3">
            <ActiveStat label="DAU · last 24h" value={metrics.data?.active.dau} />
            <ActiveStat label="WAU · last 7d" value={metrics.data?.active.wau} />
            <ActiveStat label="MAU · last 30d" value={metrics.data?.active.mau} />
          </ul>
        </CardContent>
      </Card>

      {/* Endpoints catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-primary" /> API surface
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Endpoints this admin panel currently consumes. All marked{' '}
            <Badge variant="success" className="ml-1 text-[10px]">
              live
            </Badge>{' '}
            now that the admin API has shipped.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 font-mono text-xs sm:grid-cols-2">
            <EndpointRow method="GET" path="/health" />
            <EndpointRow method="GET" path="/api/v1" />
            <EndpointRow method="POST" path="/api/v1/auth/login" />
            <EndpointRow method="GET" path="/api/v1/auth/me" />
            <EndpointRow method="GET" path="/api/v1/users/me" />
            <EndpointRow method="PATCH" path="/api/v1/users/me" />
            <EndpointRow method="GET" path="/api/v1/admin/metrics" />
            <EndpointRow method="GET" path="/api/v1/admin/health" />
            <EndpointRow method="GET" path="/api/v1/admin/dashboard" />
            <EndpointRow method="GET" path="/api/v1/admin/users" />
            <EndpointRow method="GET" path="/api/v1/admin/active-users" />
            <EndpointRow method="GET" path="/api/v1/admin/leaderboard" />
            <EndpointRow method="GET" path="/api/v1/admin/audit" />
            <EndpointRow method="GET" path="/api/v1/admin/moderation/queue" />
            <EndpointRow method="POST" path="/api/v1/admin/moderation/scan" />
            <EndpointRow
              method="POST"
              path="/api/v1/admin/moderation/flags/:id/decision"
            />
            <EndpointRow method="GET" path="/api/v1/admin/analytics/overview" />
            <EndpointRow method="GET" path="/api/v1/admin/defaults" />
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function ResourceCard({ health }: { health?: ExtendedHealth }) {
  const mb = (n?: number) => (n != null ? `${n} MB` : '—');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="size-4 text-primary" /> Runtime
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Node" value={health?.nodeVersion ?? '—'} mono />
        <Row label="RSS" value={mb(health?.memoryMb.rss)} />
        <Row label="Heap used" value={mb(health?.memoryMb.heapUsed)} />
        <Row label="Heap total" value={mb(health?.memoryMb.heapTotal)} />
        <Row
          label="DB ping"
          value={
            health?.db.latencyMs != null ? `${health.db.latencyMs} ms` : '—'
          }
        />
      </CardContent>
    </Card>
  );
}

function UsersCard({ metrics }: { metrics?: SystemMetrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-primary" /> Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Total" value={metrics?.users.total ?? '—'} />
        <Row label="Admins" value={metrics?.users.admins ?? '—'} />
        <Row label="Suspended" value={metrics?.users.suspended ?? '—'} />
        <Row label="New · 7d" value={metrics?.users.newLast7d ?? '—'} />
        <Row label="New · 30d" value={metrics?.users.newLast30d ?? '—'} />
      </CardContent>
    </Card>
  );
}

function ContentCard({ metrics }: { metrics?: SystemMetrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="size-4 text-primary" /> Content volume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Salah days" value={metrics?.content.salahDays ?? '—'} />
        <Row label="Quran days" value={metrics?.content.quranDays ?? '—'} />
        <Row
          label="Quran pages"
          value={metrics?.content.totalQuranPages ?? '—'}
        />
        <Row
          label="Habit defs"
          value={metrics?.content.habitDefinitions ?? '—'}
        />
        <Row
          label="Checklist days"
          value={metrics?.content.checklistDays ?? '—'}
        />
        <Row label="Dhikr days" value={metrics?.content.dhikrDays ?? '—'} />
      </CardContent>
    </Card>
  );
}

function ActiveStat({ label, value }: { label: string; value?: number }) {
  return (
    <li className="rounded-xl border border-border/60 bg-card/40 p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">
        {value ?? '—'}
      </p>
    </li>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span
        className={
          mono ? 'font-mono text-xs' : 'text-sm font-medium tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  );
}

function EndpointRow({ method, path }: { method: string; path: string }) {
  return (
    <li className="flex items-baseline justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
      <span className="flex items-baseline gap-2">
        <span
          className={
            method === 'GET'
              ? 'rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary'
              : method === 'POST'
                ? 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300'
                : method === 'PATCH'
                  ? 'rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300'
                  : 'rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground'
          }
        >
          {method}
        </span>
        <span className="text-foreground/85">{path}</span>
      </span>
      <Badge variant="success" className="text-[9px]">
        live
      </Badge>
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

// Used implicitly to keep ServerCog import alive for some lint configs.
void ServerCog;
