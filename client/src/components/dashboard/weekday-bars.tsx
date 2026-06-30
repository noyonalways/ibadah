'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayPoints } from '@/lib/stats/stats-api';

interface Props {
  /** Last-30-days window of daily totals. */
  days: DayPoints[];
}

/**
 * Average points per weekday over the last 30 days. Helps users see
 * which day of the week they're strongest on — useful for the Friday
 * rhythm specifically, since the Jummah ceiling is higher.
 *
 * Bars are colored uniformly except the user's "best" weekday, which is
 * highlighted in accent gold so the takeaway is glanceable.
 */
export function WeekdayBars({ days }: Props) {
  const t = useTranslations('Dashboard');

  // Localize weekday short names off the runtime so they follow the
  // active locale (Sun→Sat in en, রবি→শনি in bn, الأحد→السبت in ar).
  const WEEKDAY_LABELS = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
    // 1970-01-04 is a Sunday — anchor the cycle there for stability.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.UTC(1970, 0, 4 + i));
      return fmt.format(d);
    });
  }, []);

  const data = React.useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    for (const d of days) {
      // Parse YYYY-MM-DD as UTC so all clients agree on the weekday.
      const dt = new Date(`${d.date}T00:00:00Z`);
      const idx = dt.getUTCDay();
      totals[idx] += d.total;
      counts[idx] += 1;
    }

    return WEEKDAY_LABELS.map((label, i) => ({
      label,
      avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
      total: totals[i],
      count: counts[i],
      isFriday: i === 5,
    }));
  }, [days, WEEKDAY_LABELS]);

  const peak = data.reduce((max, d) => (d.avg > max ? d.avg : max), 0);
  const peakIdx = data.findIndex((d) => d.avg === peak && peak > 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t('weekday_title')}
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {t('weekday_window')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-2">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weekday-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="weekday-peak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-deep)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.7} />
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
                fontSize={11}
                tickMargin={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={11}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<WeekdayTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
              <Bar dataKey="avg" radius={[6, 6, 2, 2]} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={i === peakIdx ? 'url(#weekday-peak)' : 'url(#weekday-bar)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {peak > 0 && (
          <p className="mt-2 px-3 text-[11px] text-muted-foreground">
            {t.rich('weekday_peak_caption', {
              day: () => (
                <span className="font-semibold text-foreground">{data[peakIdx].label}</span>
              ),
              points: () => (
                <span className="font-semibold tabular-nums text-foreground">{peak}</span>
              ),
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface WeekdayPayloadEntry {
  value: number;
  payload?: { label?: string; total?: number; count?: number };
}

function WeekdayTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: WeekdayPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{p.payload?.label}</p>
      <p className="mt-1 tabular-nums text-foreground">avg: {p.value}</p>
      {(p.payload?.count ?? 0) > 0 && (
        <p className="text-[10px] tabular-nums text-muted-foreground">
          {p.payload?.count}× · total {p.payload?.total}
        </p>
      )}
    </div>
  );
}
