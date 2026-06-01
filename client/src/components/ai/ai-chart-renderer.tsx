'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ChartSpec } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

/**
 * Renders a ChartSpec emitted by the AI assistant. Maps to one of four
 * Recharts components (`bar`, `line`, `area`, `pie`) and resolves
 * design-token color names (e.g. `primary`, `accent-deep`, `chart-1`)
 * to CSS variables so charts inherit the active theme.
 */
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

const DEFAULT_PALETTE = ['primary', 'accent-deep', 'tertiary', 'chart-4', 'chart-5'];

const resolveColor = (token: string | undefined): string =>
  (token && TOKEN_TO_VAR[token]) || token || 'var(--primary)';

interface AIChartRendererProps {
  spec: ChartSpec;
  className?: string;
  height?: number;
}

export function AIChartRenderer({ spec, className, height = 220 }: AIChartRendererProps) {
  const { type, title, description } = spec;
  const xKey = spec.xKey ?? 'label';
  const yKeys = useMemo(
    () => (spec.yKeys && spec.yKeys.length > 0 ? spec.yKeys : ['value']),
    [spec.yKeys],
  );
  const palette = useMemo(
    () => (spec.colors && spec.colors.length > 0 ? spec.colors : DEFAULT_PALETTE),
    [spec.colors],
  );
  const colors = useMemo(
    () => yKeys.map((_, i) => resolveColor(palette[i % palette.length])),
    [yKeys, palette],
  );

  // Defensive: drop rows that are clearly not objects.
  const data = useMemo(
    () => (Array.isArray(spec.data) ? spec.data.filter((d) => d && typeof d === 'object') : []),
    [spec.data],
  );

  if (data.length === 0) {
    return (
      <figure
        className={cn(
          'mt-3 rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground',
          className,
        )}
      >
        Empty chart — no data points provided.
      </figure>
    );
  }

  const tooltipStyle = {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    fontSize: 12,
  } as const;

  let chart: React.ReactNode = null;
  if (type === 'pie') {
    chart = (
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Pie
          data={data}
          dataKey={yKeys[0] ?? 'value'}
          nameKey={xKey}
          innerRadius="45%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={resolveColor(palette[i % palette.length])} />
          ))}
        </Pie>
      </PieChart>
    );
  } else if (type === 'line') {
    chart = (
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={36} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
        {yKeys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            name={spec.yLabels?.[i] ?? k}
            stroke={colors[i]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    );
  } else if (type === 'area') {
    chart = (
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {yKeys.map((k, i) => (
            <linearGradient key={k} id={`ai-grad-${k}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colors[i]} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={36} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
        {yKeys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            name={spec.yLabels?.[i] ?? k}
            stroke={colors[i]}
            strokeWidth={2}
            fill={`url(#ai-grad-${k}-${i})`}
            stackId={spec.stacked ? '1' : undefined}
          />
        ))}
      </AreaChart>
    );
  } else {
    // Default: bar
    chart = (
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={36} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
        {yKeys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            name={spec.yLabels?.[i] ?? k}
            fill={colors[i]}
            radius={[6, 6, 0, 0]}
            stackId={spec.stacked ? '1' : undefined}
          />
        ))}
      </BarChart>
    );
  }

  return (
    <figure
      className={cn(
        'mt-3 rounded-xl border border-border/60 bg-card/50 p-3',
        className,
      )}
    >
      {(title || description) && (
        <figcaption className="mb-2 px-1">
          {title && <p className="text-sm font-semibold tracking-tight">{title}</p>}
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </figcaption>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">{chart as React.ReactElement}</ResponsiveContainer>
      </div>
    </figure>
  );
}

const axisProps = {
  stroke: 'var(--muted-foreground)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
