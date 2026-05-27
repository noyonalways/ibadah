'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Database, Globe, Layers } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { RequiresAdminApi } from '@/components/admin/requires-admin-api';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, fetchHealth } from '@/lib/api';

export default function SystemPage() {
  const health = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
  });

  const apiInfo = useQuery({
    queryKey: ['admin', 'system', 'api'],
    queryFn: () => api<{ name: string; version: string }>('/', { auth: false }),
  });

  const status = health.isError ? 'down' : health.isLoading ? 'pending' : 'online';
  const tone =
    status === 'online' ? 'primary' : status === 'pending' ? 'tertiary' : 'destructive';

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System"
        description="Live infrastructure status. Health is polled every 15 seconds."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={status === 'down' ? AlertTriangle : CheckCircle2}
          label="API status"
          value={status}
          sublabel={health.data?.status ?? '—'}
          tone={tone}
        />
        <StatCard
          icon={Activity}
          label="Uptime"
          value={health.data ? formatUptime(health.data.uptime) : '—'}
          sublabel="since last restart"
          tone="accent"
        />
        <StatCard
          icon={Globe}
          label="API"
          value={apiInfo.data?.name ?? '—'}
          sublabel={apiInfo.data?.version ?? '—'}
          tone="primary"
        />
        <StatCard
          icon={Database}
          label="Database"
          value="Mongo"
          sublabel="Atlas-managed"
          tone="tertiary"
        />
      </div>

      {/* Endpoints catalog — what the admin currently consumes. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4 text-primary" /> Active integrations
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Endpoints this admin panel currently consumes. Anything stamped{' '}
            <Badge variant="warning" className="ml-1 text-[10px]">
              pending
            </Badge>{' '}
            is documented in design.md §10.2 and not yet implemented on the server.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 font-mono text-xs sm:grid-cols-2">
            <EndpointRow method="GET" path="/health" status="live" />
            <EndpointRow method="GET" path="/api/v1" status="live" />
            <EndpointRow method="POST" path="/api/v1/auth/login" status="live" />
            <EndpointRow method="GET" path="/api/v1/auth/me" status="live" />
            <EndpointRow method="GET" path="/api/v1/users/me" status="live" />
            <EndpointRow method="PATCH" path="/api/v1/users/me" status="live" />
            <EndpointRow method="GET" path="/api/v1/stats/daily" status="live" />
            <EndpointRow method="GET" path="/api/v1/stats/streaks" status="live" />
            <EndpointRow method="GET" path="/api/v1/salah/:date" status="live" />
            <EndpointRow method="PUT" path="/api/v1/salah/:date" status="live" />
            <EndpointRow method="GET" path="/api/v1/quran/:date" status="live" />
            <EndpointRow method="PUT" path="/api/v1/quran/:date" status="live" />
            <EndpointRow method="GET" path="/api/v1/dhikr/:date" status="live" />
            <EndpointRow method="GET" path="/api/v1/habits" status="live" />
            <EndpointRow method="GET" path="/api/v1/checklist/:date" status="live" />
            <EndpointRow method="GET" path="/api/v1/admin/users" status="pending" />
            <EndpointRow method="GET" path="/api/v1/admin/audit" status="pending" />
            <EndpointRow method="GET" path="/api/v1/admin/metrics" status="pending" />
          </ul>
        </CardContent>
      </Card>

      <RequiresAdminApi
        title="System metrics endpoint"
        description="A future /admin/metrics route should expose database counts, daily-active users, error rate, and average request latency for richer system-health dashboards."
        endpoints={[
          { method: 'GET', path: '/admin/metrics', note: 'aggregated counts + DAU + p95 latency' },
          { method: 'GET', path: '/admin/metrics/timeseries?metric&from&to' },
        ]}
      />
    </>
  );
}

function EndpointRow({
  method,
  path,
  status,
}: {
  method: string;
  path: string;
  status: 'live' | 'pending';
}) {
  return (
    <li className="flex items-baseline justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
      <span className="flex items-baseline gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
            method === 'GET'
              ? 'bg-primary/10 text-primary'
              : method === 'POST'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          }`}
        >
          {method}
        </span>
        <span className="text-foreground/85">{path}</span>
      </span>
      <Badge variant={status === 'live' ? 'success' : 'warning'} className="text-[9px]">
        {status}
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
