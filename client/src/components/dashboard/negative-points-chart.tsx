'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';

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

/**
 * Salah-points balance over the last 30 days, with negative-day bars
 * called out separately. Useful for surfacing the cumulative cost of
 * missed Fard prayers (the only source of negative points in the app).
 *
 * Design choices:
 *  - Recharts `BarChart` natively supports negative values: the y=0
 *    axis splits positive bars (primary) from negative bars (destructive).
 *  - We render a ReferenceLine at y=0 so the boundary is unambiguous.
 *  - Summary tiles call out: # days with penalties, total negative
 *    points, and the worst single day.
 *  - When the user has zero penalty days in the window we render a
 *    positive empty state instead of a flat chart — this is encouragement,
 *    not a feature absence.
 */
export function NegativePointsChart({ days }: Props) {
  const t = useTranslations('Dashboard');

  const data = React.useMemo(() => {
    const map = new Map(days.map((d) => [d.date, d]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const out: Array<{
      label: string;
      date: string;
      salah: number;
      isNegative: boolean;
    }> = [];

    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = map.get(key);
      const salah = found?.salah ?? 0;
      out.push({
        label: d.getDate().toString(),
        date: key,
        salah,
        isNegative: salah < 0,
      });
    }
    return out;
  }, [days]);

  const stats = React.useMemo(() => {
    const negatives = data.filter((d) => d.isNegative);
    const totalLost = negatives.reduce((sum, d) => sum + d.salah, 0);
    const worst = negatives.reduce<{ date: string; salah: number } | null>(
      (acc, d) => (acc === null || d.salah < acc.salah ? d : acc),
      null,
    );
    const positives = data.filter((d) => d.salah > 0).length;
    return {
      negativeDays: negatives.length,
      positiveDays: positives,
      totalLost,
      worst,
    };
  }, [data]);

  const hasNegatives = stats.negativeDays > 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full',
                hasNegatives
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
              )}
              aria-hidden
            >
              {hasNegatives ? (
                <TrendingDown className="size-3.5" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
            </span>
            <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t('negative_points_title')}
            </CardTitle>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {t('last_n_days', { days: WINDOW_DAYS })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-2 pb-5 pt-1">
        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-2 px-2">
          <SummaryTile
            label={t('negative_points_days_label')}
            value={String(stats.negativeDays)}
            tone={hasNegatives ? 'destructive' : 'positive'}
          />
          <SummaryTile
            label={t('negative_points_total_label')}
            value={
              hasNegatives
                ? `${stats.totalLost}` // already signed (negative)
                : '0'
            }
            tone={hasNegatives ? 'destructive' : 'positive'}
          />
          <SummaryTile
            label={t('negative_points_worst_label')}
            value={
              stats.worst
                ? `${stats.worst.salah}`
                : '—'
            }
            tone={hasNegatives ? 'destructive' : 'muted'}
            sublabel={
              stats.worst
                ? new Date(stats.worst.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : undefined
            }
          />
        </div>

        {/* Chart */}
        <div className="h-44 w-full sm:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="np-bar-pos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="np-bar-neg" x1="0" y1="0" x2="0" y2="1">
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
                allowDecimals={false}
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.25} />
              <Tooltip
                content={<NegativeTooltip />}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              />
              <Bar dataKey="salah" radius={[4, 4, 4, 4]} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.isNegative ? 'url(#np-bar-neg)' : 'url(#np-bar-pos)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / caption */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 text-[11px]">
          <div className="flex items-center gap-4 text-muted-foreground">
            <LegendDot color="var(--primary)" label={t('negative_points_legend_positive')} />
            <LegendDot color="var(--destructive)" label={t('negative_points_legend_negative')} />
          </div>

          {hasNegatives ? (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="size-3.5 text-destructive" />
              <span>{t('negative_points_caption_has')}</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('negative_points_caption_clean')}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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

interface TooltipPayloadEntry {
  value: number;
  payload?: { date?: string; isNegative?: boolean };
}

function NegativeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const dateStr = p.payload?.date;
  const label = dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const negative = p.payload?.isNegative;

  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p
        className={cn(
          'mt-1 text-sm font-semibold tabular-nums',
          negative ? 'text-destructive' : p.value > 0 ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {p.value > 0 ? '+' : ''}
        {p.value}
      </p>
    </div>
  );
}
