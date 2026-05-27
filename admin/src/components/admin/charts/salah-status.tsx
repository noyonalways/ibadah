'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { cn } from '@/lib/utils';

/**
 * Donut chart of salah Fard timing status. The five non-pending
 * statuses each get a token-based hue; "pending" is a neutral grey.
 */
export interface SalahStatusCounts {
  pending: number;
  on_time_awwal: number;
  on_time_mid: number;
  on_time_last: number;
  late: number;
  missed: number;
}

const ORDER: { key: keyof SalahStatusCounts; label: string; color: string }[] = [
  { key: 'on_time_awwal', label: 'Awwal Waqt', color: 'var(--primary)' },
  { key: 'on_time_mid', label: 'Mid window', color: 'var(--primary-soft)' },
  { key: 'on_time_last', label: 'Last window', color: 'var(--accent)' },
  { key: 'late', label: 'Late / Qaza', color: 'var(--accent-deep)' },
  { key: 'missed', label: 'Missed', color: 'var(--destructive)' },
  { key: 'pending', label: 'Not logged', color: 'var(--muted-foreground)' },
];


export function SalahStatusDonut({
  counts,
  height = 240,
  className,
}: {
  counts: SalahStatusCounts;
  height?: number;
  className?: string;
}) {
  const data = ORDER.map((o) => ({
    name: o.label,
    value: counts[o.key] ?? 0,
    color: o.color,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div
        className={cn(
          'grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-center',
          className,
        )}
        style={{ height }}
      >
        <div>
          <p className="text-sm font-medium">No salah logged in this window</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Once users log prayers, the timing distribution will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Compute the on-time share for the centerpiece — the metric that
  // matters most: Awwal + Mid + Last as % of all *logged* prayers.
  const logged = total - (counts.pending ?? 0);
  const onTime =
    (counts.on_time_awwal ?? 0) + (counts.on_time_mid ?? 0) + (counts.on_time_last ?? 0);
  const pct = logged > 0 ? Math.round((onTime / logged) * 100) : 0;

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: number, name: string) => [`${v} (${Math.round((v / total) * 100)}%)`, name]}
          />
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="86%"
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-3xl font-bold tracking-tight tabular-nums">{pct}%</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            on time
          </p>
        </div>
      </div>
    </div>
  );
}

export function SalahStatusLegend({ counts }: { counts: SalahStatusCounts }) {
  const total = ORDER.reduce((s, o) => s + (counts[o.key] ?? 0), 0);
  return (
    <ul className="grid grid-cols-2 gap-2 text-xs">
      {ORDER.map((o) => {
        const value = counts[o.key] ?? 0;
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <li key={o.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: o.color }}
              aria-hidden
            />
            <span className="flex-1 truncate text-muted-foreground">{o.label}</span>
            <span className="font-medium tabular-nums">{value}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}
