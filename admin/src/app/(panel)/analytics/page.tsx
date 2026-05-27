'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Loader2,
  PieChart as PieIcon,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { RangePicker, type RangeValue } from '@/components/admin/range-picker';
import {
  ChartCard,
  ChartBadge,
} from '@/components/admin/charts/chart-card';
import { TimeSeriesChart } from '@/components/admin/charts/time-series-chart';
import {
  SalahStatusDonut,
  SalahStatusLegend,
} from '@/components/admin/charts/salah-status';
import { ScoreHistogram } from '@/components/admin/charts/score-histogram';
import { PillarBreakdown } from '@/components/admin/charts/pillar-breakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsApi } from '@/lib/admin-api';

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeValue | null>(null);

  const overview = useQuery({
    queryKey: ['admin', 'analytics', 'overview', range?.from, range?.to],
    queryFn: () => analyticsApi.overview(range ?? {}),
    enabled: !!range,
  });


  const data = overview.data;

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Application analytics"
        description="Time-series engagement, full pillar breakdown across salah, quran, habits, checklist and dhikr, plus a system-wide score distribution. All metrics scoped to the chosen date range."
      />

      <RangePicker defaultPreset="30" onChange={setRange} />

      {overview.isLoading || !data ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Computing analytics over the chosen window…
        </div>
      ) : (
        <>
          {/* ---- Top KPI strip ---- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Active users"
              value={data.activeUsers.unique}
              sublabel="distinct users with worship logged"
              tone="primary"
            />
            <StatCard
              icon={Sparkles}
              label="New signups"
              value={data.signups.total}
              sublabel="in the selected window"
              tone="accent"
            />
            <StatCard
              icon={TrendingUp}
              label="Total points"
              value={(
                data.pillars.salah.totalPoints +
                data.pillars.habits.totalPoints +
                data.pillars.checklist.totalPoints
              ).toLocaleString()}
              sublabel={`across ${data.range.days} days`}
              tone="tertiary"
            />
            <StatCard
              icon={Activity}
              label="Engaged users"
              value={
                data.distribution.totalUsers > 0
                  ? `${Math.round(
                      (data.distribution.participants / data.distribution.totalUsers) * 100,
                    )}%`
                  : '—'
              }
              sublabel={`${data.distribution.participants} of ${data.distribution.totalUsers} users`}
              tone="primary"
            />
          </div>

          {/* ---- Pillar breakdown ---- */}
          <PillarBreakdown pillars={data.pillars} />

          {/* ---- Time-series ---- */}
          <Tabs defaultValue="engagement">
            <TabsList>
              <TabsTrigger value="engagement" className="gap-1.5">
                <Activity className="size-3.5" />
                Engagement
              </TabsTrigger>
              <TabsTrigger value="points" className="gap-1.5">
                <TrendingUp className="size-3.5" />
                Points by pillar
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5">
                <BarChart3 className="size-3.5" />
                Content volume
              </TabsTrigger>
            </TabsList>

            <TabsContent value="engagement">
              <ChartCard
                title="Daily active users & signups"
                description="Distinct users who logged any worship that day vs new accounts created."
                badge={<ChartBadge>{data.range.days} days</ChartBadge>}
              >
                <TimeSeriesChart
                  data={data.daily}
                  series={[
                    { key: 'activeUsers', label: 'Active users', color: 'primary' },
                    { key: 'signups', label: 'New signups', color: 'accent-deep' },
                  ]}
                />
              </ChartCard>
            </TabsContent>

            <TabsContent value="points">
              <ChartCard
                title="Daily points by pillar"
                description="How much score is being generated each day, broken down by pillar."
                badge={<ChartBadge>{data.range.days} days</ChartBadge>}
              >
                <TimeSeriesChart
                  data={data.daily}
                  series={[
                    { key: 'salahPoints', label: 'Salah', color: 'primary' },
                    { key: 'habitPoints', label: 'Habits', color: 'tertiary' },
                    { key: 'checklistPoints', label: 'Checklist', color: 'accent-deep' },
                  ]}
                />
              </ChartCard>
            </TabsContent>

            <TabsContent value="content">
              <ChartCard
                title="Daily content volume"
                description="Quran pages read and dhikr recitations across all users."
                badge={<ChartBadge>{data.range.days} days</ChartBadge>}
              >
                <TimeSeriesChart
                  data={data.daily}
                  series={[
                    { key: 'quranPages', label: 'Quran pages', color: 'accent' },
                    { key: 'dhikrCount', label: 'Dhikr count', color: 'chart-3' },
                  ]}
                />
              </ChartCard>
            </TabsContent>
          </Tabs>

          {/* ---- Salah status donut + Score histogram ---- */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Salah timing distribution"
              description="Across every Fard prayer logged in the window. The donut shows on-time vs late/missed; the legend gives the absolute breakdown."
              badge={
                <ChartBadge>
                  {(
                    data.pillars.salah.statusCounts.on_time_awwal +
                    data.pillars.salah.statusCounts.on_time_mid +
                    data.pillars.salah.statusCounts.on_time_last +
                    data.pillars.salah.statusCounts.late +
                    data.pillars.salah.statusCounts.missed
                  ).toLocaleString()}{' '}
                  prayers
                </ChartBadge>
              }
            >
              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <SalahStatusDonut counts={data.pillars.salah.statusCounts} />
                <SalahStatusLegend counts={data.pillars.salah.statusCounts} />
              </div>
            </ChartCard>

            <ChartCard
              title="User score distribution"
              description="How many users fall in each score bucket over this window. Long-tail to the right means power users; mass at zero means low engagement."
              badge={<ChartBadge>{data.distribution.participants} participants</ChartBadge>}
            >
              <ScoreHistogram data={data.distribution.buckets} />
            </ChartCard>
          </div>

          {/* ---- Top dhikr presets ---- */}
          {data.pillars.dhikr.byPreset.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="size-4 text-tertiary" />
                  Top dhikr presets
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aggregate recitation counts across all users in the window.
                </p>
              </CardHeader>
              <CardContent>
                <DhikrPresetBars data={data.pillars.dhikr.byPreset} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function DhikrPresetBars({ data }: { data: { slug: string; label: string; count: number }[] }) {
  const top = data.slice(0, 8);
  const max = Math.max(1, ...top.map((d) => d.count));
  return (
    <ul className="space-y-2.5">
      {top.map((d) => {
        const w = Math.round((d.count / max) * 100);
        return (
          <li key={d.slug}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="truncate font-medium">{d.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {d.count.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent-deep"
                style={{ width: `${w}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
