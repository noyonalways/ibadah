'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayPoints } from '@/lib/stats/stats-api';

interface Props {
  /** Daily points window (>= last 7 days, more is fine). */
  days: DayPoints[];
  /** YYYY-MM-DD inclusive lower bound for the donut window. */
  from: string;
}

/**
 * Donut chart showing how the user's last-week points break down across
 * pillars. Salah, Habits, and Checklist are summed into the total slice;
 * Quran reading is reported as pages alongside since it doesn't roll into
 * the points total but matters to the user's sense of balance.
 *
 * When the user has zero activity in the window the donut renders as a
 * neutral placeholder so the dashboard layout stays stable.
 */
export function PillarsMix({ days, from }: Props) {
  const t = useTranslations('Dashboard');

  // Keep palette derived from CSS vars so it auto-adapts to the theme.
  const PALETTE = React.useMemo(
    () => [
      { key: 'salah', color: 'var(--primary)' },
      { key: 'habit', color: 'var(--accent-deep)' },
      { key: 'checklist', color: 'var(--tertiary)' },
    ] as const,
    [],
  );

  const sums = React.useMemo(() => {
    const window = days.filter((d) => d.date >= from);
    return window.reduce(
      (acc, d) => {
        acc.salah += d.salah;
        acc.habit += d.habit;
        acc.checklist += d.checklist;
        acc.quranPages += d.quranPages;
        return acc;
      },
      { salah: 0, habit: 0, checklist: 0, quranPages: 0 },
    );
  }, [days, from]);

  const total = sums.salah + sums.habit + sums.checklist;
  const data = PALETTE.map((p) => ({
    key: p.key,
    name: t(`pillar_${p.key}`),
    value: Math.max(0, sums[p.key as keyof typeof sums] as number),
    color: p.color,
  }));
  const isEmpty = total <= 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t('pillars_mix_title')}
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">{t('pillars_mix_window')}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-5 pt-1">
        <div className="grid items-center gap-2 sm:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-44 w-44 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {/* Subtle radial fade behind the slices so the chart
                      reads on both light and dark backgrounds. */}
                  <radialGradient id="pmix-bg" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="var(--muted)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--muted)" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <Pie
                  data={isEmpty ? [{ name: 'empty', value: 1, color: 'var(--muted)' }] : data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={isEmpty ? 0 : 3}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {(isEmpty ? [{ color: 'var(--muted)' }] : data).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                {!isEmpty && <Tooltip content={<MixTooltip />} />}
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t('pillars_mix_total')}
                </p>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {total > 0 ? '+' : ''}
                  {total}
                </p>
              </div>
            </div>
          </div>

          {/* Legend / breakdown rail */}
          <ul className="space-y-2.5">
            {data.map((d) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <li key={d.key} className="flex items-center gap-3 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: d.color }}
                    aria-hidden
                  />
                  <span className="flex-1 text-muted-foreground">{d.name}</span>
                  <span className="tabular-nums font-semibold">{d.value}</span>
                  <span className="w-9 text-right tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </li>
              );
            })}

            {/* Quran rides along — it's a count, not a points contribution. */}
            <li className="flex items-center gap-3 border-t border-border/60 pt-2.5 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-amber-500"
                aria-hidden
              />
              <span className="flex-1 text-muted-foreground">{t('pillar_quran_pages')}</span>
              <span className="tabular-nums font-semibold">{sums.quranPages}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface TooltipPayloadEntry {
  value: number;
  name?: string;
  color?: string;
  payload?: { color?: string };
}

function MixTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: entry.payload?.color ?? entry.color }}
          aria-hidden
        />
        <span className="font-medium">{entry.name}</span>
      </div>
      <p className="mt-1 tabular-nums text-foreground">{entry.value}</p>
    </div>
  );
}
