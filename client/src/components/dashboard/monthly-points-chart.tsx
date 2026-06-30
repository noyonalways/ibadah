'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayPoints } from '@/lib/stats/stats-api';
import { cn } from '@/lib/utils';

interface Props {
  /**
   * Daily points window. Anything containing the last 30 days is fine —
   * the component slices internally so it can share the dashboard's
   * existing 70-day query without an extra fetch.
   */
  days: DayPoints[];
}

const WINDOW_DAYS = 30;

interface ChartDatum {
  /** Day-of-month label (e.g. "12") for compact x-axis ticks. */
  label: string;
  /** Full ISO date for the tooltip header. */
  date: string;
  /** Sum of all positive contributions for the day. */
  earned: number;
  /** Sum of all negative contributions for the day (≤ 0). */
  lost: number;
  /** Daily net (= earned + lost). Equals `DayPoints.total`. */
  total: number;
  /** Cumulative net total from the start of the window. */
  cumulative: number;
}

/**
 * Total daily points across all pillars for the last 30 days, split
 * into positive and negative bars around the y=0 baseline, with a
 * cumulative net line tracing momentum.
 *
 * Distinct from the sibling `NegativePointsChart`, which only visualises
 * the Salah pillar:
 *   - This chart includes Salah + habits + checklist + Quran (= the
 *     `total` field), so a user with strong habits but a couple of
 *     missed Fards still sees a net-positive day above the axis.
 *   - The cumulative line answers "are we trending upwards over the
 *     month?" at a glance.
 *
 * Empty state: when the entire 30-day window is silent, we fall back
 * to a friendly nudge instead of a flat chart.
 */
export function MonthlyPointsChart({ days }: Props) {
  const t = useTranslations('Dashboard');

  const data = React.useMemo<ChartDatum[]>(() => {
    const map = new Map(days.map((d) => [d.date, d]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const out: ChartDatum[] = [];
    let running = 0;

    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = map.get(key);

      // Decompose `total` into a positive and negative slice. We keep
      // each pillar's sign so a habit-positive / salah-negative day
      // still shows both bars, giving an honest picture of effort.
      const salah = found?.salah ?? 0;
      const habit = found?.habit ?? 0;
      const checklist = found?.checklist ?? 0;
      const quran = found?.quranPages ?? 0;
      const positives = [salah, habit, checklist, quran].filter((v) => v > 0);
      const negatives = [salah, habit, checklist, quran].filter((v) => v < 0);
      const earned = positives.reduce((s, v) => s + v, 0);
      const lost = negatives.reduce((s, v) => s + v, 0);
      const total = earned + lost;
      running += total;

      out.push({
        label: d.getDate().toString(),
        date: key,
        earned,
        lost,
        total,
        cumulative: running,
      });
    }
    return out;
  }, [days]);

  const stats = React.useMemo(() => {
    const totalEarned = data.reduce((s, d) => s + d.earned, 0);
    const totalLost = data.reduce((s, d) => s + d.lost, 0);
    const net = totalEarned + totalLost;

    const best = data.reduce<ChartDatum | null>(
      (acc, d) => (acc === null || d.total > acc.total ? d : acc),
      null,
    );
    const worst = data.reduce<ChartDatum | null>(
      (acc, d) => (acc === null || d.total < acc.total ? d : acc),
      null,
    );
    const activeDays = data.filter((d) => d.total !== 0).length;

    return { totalEarned, totalLost, net, best, worst, activeDays };
  }, [data]);

  const hasAnyActivity = stats.activeDays > 0;
  const trendPositive = stats.net >= 0;

  // Fixed domain reduces visual jitter from day to day. We pad by 10%
  // and snap to round numbers so the y-axis labels stay legible.
  const yDomain = React.useMemo<[number, number]>(() => {
    if (!hasAnyActivity) return [-5, 5];
    const maxEarned = Math.max(...data.map((d) => d.earned), 0);
    const minLost = Math.min(...data.map((d) => d.lost), 0);
    const top = Math.ceil((maxEarned * 1.1) / 5) * 5;
    const bottom = Math.floor((minLost * 1.1) / 5) * 5;
    // Always include 0 in the domain.
    return [bottom, Math.max(top, 5)];
  }, [data, hasAnyActivity]);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full',
                trendPositive
                  ? 'bg-primary/15 text-primary'
                  : 'bg-destructive/15 text-destructive',
              )}
              aria-hidden
            >
              <TrendingUp
                className={cn(
                  'size-3.5 transition-transform',
                  trendPositive ? '' : 'rotate-180',
                )}
              />
            </span>
            <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t('monthly_points_title')}
            </CardTitle>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {t('last_n_days', { days: WINDOW_DAYS })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-2 pb-5 pt-1">
        {/* Summary tiles — same compact pattern as NegativePointsChart so
            the dashboard reads as one analytical row. */}
        <div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-4">
          <SummaryTile
            label={t('monthly_points_earned_label')}
            value={`+${stats.totalEarned}`}
            tone="positive"
          />
          <SummaryTile
            label={t('monthly_points_lost_label')}
            value={`${stats.totalLost}`}
            tone={stats.totalLost < 0 ? 'destructive' : 'muted'}
          />
          <SummaryTile
            label={t('monthly_points_net_label')}
            value={`${stats.net > 0 ? '+' : ''}${stats.net}`}
            tone={stats.net > 0 ? 'positive' : stats.net < 0 ? 'destructive' : 'muted'}
          />
          <SummaryTile
            label={t('monthly_points_best_label')}
            value={
              stats.best && stats.best.total > 0
                ? `+${stats.best.total}`
                : '—'
            }
            tone={stats.best && stats.best.total > 0 ? 'positive' : 'muted'}
            sublabel={
              stats.best && stats.best.total > 0
                ? new Date(stats.best.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : undefined
            }
          />
        </div>

        {/* Chart */}
        <div className="h-52 w-full sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 14, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="mp-bar-pos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="mp-bar-neg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickMargin={6}
                interval={2}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={11}
                width={36}
                domain={yDomain}
                allowDecimals={false}
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.25} />
              <Tooltip
                content={<MonthlyTooltip />}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              />
              {/* Stacked positive + negative bars share an x-tick, so the
                  combined silhouette traces the day's net total. */}
              <Bar
                dataKey="earned"
                stackId="signed"
                fill="url(#mp-bar-pos)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                name={t('monthly_points_legend_earned')}
              />
              <Bar
                dataKey="lost"
                stackId="signed"
                fill="url(#mp-bar-neg)"
                radius={[0, 0, 4, 4]}
                isAnimationActive={false}
                name={t('monthly_points_legend_lost')}
              />
              {/* Cumulative net trajectory — the single most useful read
                  for "am I trending up this month?". */}
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="var(--accent-deep)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: 'var(--accent-deep)' }}
                isAnimationActive={false}
                name={t('monthly_points_legend_cumulative')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / caption */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <LegendDot color="var(--primary)" label={t('monthly_points_legend_earned')} />
            <LegendDot color="var(--destructive)" label={t('monthly_points_legend_lost')} />
            <LegendDash color="var(--accent-deep)" label={t('monthly_points_legend_cumulative')} />
          </div>

          {hasAnyActivity ? (
            <p
              className={cn(
                'flex items-center gap-1.5',
                trendPositive ? 'text-muted-foreground' : 'text-destructive/90',
              )}
            >
              {trendPositive ? (
                <ArrowUpRight className="size-3.5 text-primary" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              <span>
                {trendPositive
                  ? t('monthly_points_caption_up')
                  : t('monthly_points_caption_down')}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="size-3.5 text-accent" />
              <span>{t('monthly_points_caption_empty')}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- bits -------------------------------- */

function SummaryTile({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone: 'destructive' | 'positive' | 'muted';
}) {
  const valueClass =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'positive'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground';

  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-card/40 px-2.5 py-2 sm:px-3">
      <p className="truncate text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-base font-bold tabular-nums tracking-tight sm:text-lg',
          valueClass,
        )}
      >
        {value}
      </p>
      {sublabel ? (
        <p className="truncate text-[10px] tabular-nums text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

function LegendDash({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="block h-[2px] w-4 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

interface TooltipPayloadEntry {
  value: number;
  name?: string;
  dataKey?: string;
  payload?: ChartDatum;
}

function MonthlyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  if (!datum) return null;

  const label = new Date(datum.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <div className="mt-1 grid gap-0.5">
        <Row
          color="var(--primary)"
          label={payload.find((p) => p.dataKey === 'earned')?.name ?? 'Earned'}
          value={datum.earned}
          sign="+"
        />
        {datum.lost < 0 && (
          <Row
            color="var(--destructive)"
            label={payload.find((p) => p.dataKey === 'lost')?.name ?? 'Lost'}
            value={datum.lost}
          />
        )}
        <div className="my-1 border-t border-border/60" />
        <Row
          color="var(--foreground)"
          label="Net"
          value={datum.total}
          sign={datum.total > 0 ? '+' : ''}
          bold
        />
        <Row
          color="var(--accent-deep)"
          label="Cumulative"
          value={datum.cumulative}
          sign={datum.cumulative > 0 ? '+' : ''}
          subtle
        />
      </div>
    </div>
  );
}

function Row({
  color,
  label,
  value,
  sign = '',
  bold = false,
  subtle = false,
}: {
  color: string;
  label: string;
  value: number;
  sign?: '+' | '-' | '';
  bold?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        subtle && 'text-muted-foreground',
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className={cn(subtle ? '' : 'text-muted-foreground')}>{label}</span>
      </span>
      <span className={cn('tabular-nums', bold && 'font-semibold')}>
        {sign}
        {value}
      </span>
    </div>
  );
}
