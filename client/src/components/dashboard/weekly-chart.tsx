'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayPoints } from '@/lib/stats-api';

/**
 * Weekly area chart of total daily points across modules. Uses a brand
 * gradient fill and a subtle grid; works in both light and dark mode by
 * deriving stroke / grid colors from CSS custom properties.
 */
export function WeeklyChart({ days }: { days: DayPoints[] }) {
  // Project the input into the last 14 days, padded with zeros where missing.
  const data = React.useMemo(() => {
    const map = new Map(days.map((d) => [d.date, d]));
    const points: { label: string; date: string; total: number; salah: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = map.get(key);
      points.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        date: key,
        total: found?.total ?? 0,
        salah: found?.salah ?? 0,
      });
    }
    return points;
  }, [days]);

  const total = data.reduce((s, d) => s + d.total, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const peak = data.reduce((m, d) => Math.max(m, d.total), 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Last 14 days
          </CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              avg <span className="font-semibold tabular-nums text-foreground">{avg}</span>
            </span>
            <span>
              peak <span className="font-semibold tabular-nums text-foreground">{peak}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-2">
        <div className="h-48 w-full sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ibadah-area-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ibadah-area-salah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
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
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={11}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
              <Area
                type="monotone"
                dataKey="salah"
                stroke="var(--accent-deep)"
                strokeWidth={1.5}
                fill="url(#ibadah-area-salah)"
                isAnimationActive={false}
                name="Salah"
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#ibadah-area-total)"
                isAnimationActive={false}
                name="Total"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
          <LegendDot color="var(--primary)" label="Total points" />
          <LegendDot color="var(--accent-deep)" label="Salah" />
        </div>
      </CardContent>
    </Card>
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
  name?: string;
  color?: string;
  dataKey?: string;
  payload?: { date?: string };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const date = payload[0].payload?.date as string | undefined;
  const label = date
    ? new Date(date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <div className="mt-1 grid gap-0.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: p.color }}
                aria-hidden
              />
              <span className="text-muted-foreground">{p.name}</span>
            </span>
            <span className="font-semibold tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
