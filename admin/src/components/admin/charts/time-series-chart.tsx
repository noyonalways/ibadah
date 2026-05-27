'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib/utils';

export interface SeriesDef {
  key: string;
  label: string;
  /** Token-based color: 'primary' | 'accent' | 'tertiary' | 'destructive' | 'success' | string */
  color: string;
}

interface TimeSeriesChartProps<T extends { date: string }> {
  data: T[];
  series: SeriesDef[];
  /** Render as 'area' (filled) or 'line' (stacked rows). Default: area. */
  height?: number;
  className?: string;
  /** Format the X-axis tick labels. Default: 'MMM d'. */
  formatTick?: (value: string) => string;
}


const FALLBACK_COLOR = 'var(--muted-foreground)';
const TOKEN_TO_VAR: Record<string, string> = {
  primary: 'var(--primary)',
  'primary-soft': 'var(--primary-soft)',
  'primary-deep': 'var(--primary-deep)',
  accent: 'var(--accent)',
  'accent-deep': 'var(--accent-deep)',
  tertiary: 'var(--tertiary)',
  destructive: 'var(--destructive)',
  success: 'var(--success)',
  'chart-1': 'var(--chart-1)',
  'chart-2': 'var(--chart-2)',
  'chart-3': 'var(--chart-3)',
  'chart-4': 'var(--chart-4)',
  'chart-5': 'var(--chart-5)',
};

const resolveColor = (c: string): string => TOKEN_TO_VAR[c] ?? c ?? FALLBACK_COLOR;

const defaultFormatTick = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function TimeSeriesChart<T extends { date: string }>({
  data,
  series,
  height = 280,
  className,
  formatTick = defaultFormatTick,
}: TimeSeriesChartProps<T>) {
  const gradientIds = useMemo(
    () => series.map((s) => `tsc-${s.key}-${Math.random().toString(36).slice(2, 8)}`),
    [series],
  );

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={gradientIds[i]} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={resolveColor(s.color)} stopOpacity={0.4} />
                <stop offset="100%" stopColor={resolveColor(s.color)} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              fontSize: 12,
            }}
            labelFormatter={(label: string) => formatTick(label)}
          />
          <Legend
            verticalAlign="top"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={resolveColor(s.color)}
              strokeWidth={2}
              fill={`url(#${gradientIds[i]})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
