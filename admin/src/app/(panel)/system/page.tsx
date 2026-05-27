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
  Loader2,
  RefreshCcw,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminHealthApi } from '@/lib/admin-api';
import { api, fetchHealth } from '@/lib/api';

export default function SystemPage() {
  const health = useQuery({
    queryKey: ['admin', 'system', 'admin-health'],
    queryFn: adminHealthApi.get,
    refetchInterval: 15_000,
  });
  const ping = useQuery({
    queryKey: ['admin', 'system', 'public-health'],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
  });
  const apiInfo = useQuery({
    queryKey: ['admin', 'system', 'api-info'],
    queryFn: () => api<{ name: string; version: string }>('/', { auth: false }),
  });

  const status = health.data?.status ?? (health.isLoading ? 'pending' : 'down');
  const statusTone =
    status === 'ok' ? 'primary' : status === 'down' ? 'destructive' : 'tertiary';

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Operational status"
        description="Live infrastructure metrics and the catalog of admin endpoints. Refreshes automatically every 15 seconds."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              health.refetch();
              ping.refetch();
              apiInfo.refetch();
            }}
            disabled={health.isFetching || ping.isFetching}
            className="gap-1.5"
          >
            {health.isFetching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="size-3.5" />
            )}
            Refresh
          </Button>
        }
      />

      {/* Top-line summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={status === 'ok' ? CheckCircle2 : AlertTriangle}
          label="Application"
          value={status}
          sublabel={
            ping.data
              ? `public /health: ${ping.data.status}`
              : ping.isError
                ? 'public /health unreachable'
                : '—'
          }
          tone={statusTone}
        />
        <StatCard
          icon={Database}
          label="Database"
          value={health.data?.db.state ?? '—'}
          sublabel={
            health.data?.db.latencyMs !== null && health.data?.db.latencyMs !== undefined
              ? `ping ${health.data.db.latencyMs} ms${health.data.db.name ? ` · ${health.data.db.name}` : ''}`
              : '—'
          }
          tone="accent"
        />
        <StatCard
          icon={Activity}
          label="Uptime"
          value={health.data ? formatUptime(health.data.uptime) : '—'}
          sublabel="since last restart"
          tone="tertiary"
        />
        <StatCard
          icon={Cpu}
          label="Heap used"
          value={health.data ? `${health.data.memoryMb.heapUsed} MB` : '—'}
          sublabel={
            health.data
              ? `RSS ${health.data.memoryMb.rss} MB · heap total ${health.data.memoryMb.heapTotal} MB`
              : ''
          }
          tone="primary"
        />
      </div>

      {/* Detail cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4 text-primary" /> Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              rows={[
                { label: 'API name', value: apiInfo.data?.name ?? '—' },
                { label: 'API version', value: apiInfo.data?.version ?? '—' },
                { label: 'Node', value: health.data?.nodeVersion ?? '—' },
                { label: 'Uptime', value: health.data ? formatUptime(health.data.uptime) : '—' },
                {
                  label: 'Generated at',
                  value: health.data
                    ? new Date(health.data.generatedAt).toLocaleString()
                    : '—',
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="size-4 text-accent-deep" /> Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              rows={[
                { label: 'Driver', value: 'mongoose / MongoDB' },
                { label: 'Connection state', value: health.data?.db.state ?? '—' },
                { label: 'Database name', value: health.data?.db.name ?? '—' },
                {
                  label: 'Ping latency',
                  value:
                    health.data?.db.latencyMs !== null && health.data?.db.latencyMs !== undefined
                      ? `${health.data.db.latencyMs} ms`
                      : '—',
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Endpoint catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Active integrations
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Endpoints the admin panel currently consumes. All are backed by{' '}
            <code className="rounded bg-muted px-1">requireAdmin</code>.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 font-mono text-xs sm:grid-cols-2">
            <EndpointRow method="GET" path="/health" />
            <EndpointRow method="GET" path="/api/v1" />
            <EndpointRow method="POST" path="/api/v1/auth/login" />
            <EndpointRow method="GET" path="/api/v1/auth/me" />
            <EndpointRow method="PATCH" path="/api/v1/users/me" />
            <EndpointRow method="GET" path="/api/v1/admin/metrics" />
            <EndpointRow method="GET" path="/api/v1/admin/leaderboard" />
            <EndpointRow method="GET" path="/api/v1/admin/active-users" />
            <EndpointRow method="GET" path="/api/v1/admin/health" />
            <EndpointRow method="GET" path="/api/v1/admin/users" />
            <EndpointRow method="GET" path="/api/v1/admin/users/:id" />
            <EndpointRow method="PATCH" path="/api/v1/admin/users/:id" />
            <EndpointRow method="DELETE" path="/api/v1/admin/users/:id" />
            <EndpointRow method="GET" path="/api/v1/admin/defaults" />
            <EndpointRow method="PUT" path="/api/v1/admin/defaults" />
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function DetailList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-2.5 text-sm">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0"
        >
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {r.label}
          </dt>
          <dd className="font-medium">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EndpointRow({ method, path }: { method: string; path: string }) {
  const tone =
    method === 'GET'
      ? 'bg-primary/10 text-primary'
      : method === 'POST'
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
        : method === 'DELETE'
          ? 'bg-destructive/15 text-destructive'
          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  return (
    <li className="flex items-baseline justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
      <span className="flex items-baseline gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>
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
