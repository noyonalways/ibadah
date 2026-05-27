'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * GitHub-style activity heatmap. Zero dependencies — pure CSS grid
 * with a quartile-based color ramp.
 *
 * Input: an array of `{ date, value }` covering a contiguous window.
 * Anything missing is treated as zero. The ramp is computed from the
 * non-zero distribution so a flat 5/day looks the same as a flat
 * 500/day; what matters is relative engagement.
 */
interface HeatmapProps {
  data: { date: string; value: number }[];
  /** Layout: 'weeks' shows columns of weeks (default), 'months' is a longer strip. */
  className?: string;
}


const RAMP = [
  'bg-muted/60',
  'bg-primary/20',
  'bg-primary/45',
  'bg-primary/70',
  'bg-primary',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDayKey(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function Heatmap({ data, className }: HeatmapProps) {
  const { weeks, levelOf, monthLabels } = useMemo(() => {
    if (data.length === 0) {
      return { weeks: [] as { date: string; value: number; level: number }[][], levelOf: () => 0, monthLabels: [] };
    }

    // Lookup: date -> value
    const map = new Map<string, number>();
    for (const d of data) map.set(d.date, d.value);

    // Compute thresholds. Filter out zeros for the ramp so an all-zero
    // window doesn't produce NaN.
    const positives = data.map((d) => d.value).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (p: number): number => {
      if (positives.length === 0) return Infinity;
      const idx = Math.min(positives.length - 1, Math.floor(p * (positives.length - 1)));
      return positives[idx];
    };
    const thresholds = [q(0.25), q(0.5), q(0.75)];

    const levelOfFn = (v: number): number => {
      if (v <= 0) return 0;
      if (v <= thresholds[0]) return 1;
      if (v <= thresholds[1]) return 2;
      if (v <= thresholds[2]) return 3;
      return 4;
    };

    // Range start: the first date in the data, padded back to its Sunday.
    const sortedDates = [...map.keys()].sort();
    const first = parseDayKey(sortedDates[0]);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back to Sunday
    const last = parseDayKey(sortedDates[sortedDates.length - 1]);
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay())); // forward to Saturday

    const out: { date: string; value: number; level: number }[][] = [];
    const labels: { col: number; label: string }[] = [];
    let week: { date: string; value: number; level: number }[] = [];
    let lastMonth = -1;

    for (
      let cur = new Date(start);
      cur <= end;
      cur.setDate(cur.getDate() + 1)
    ) {
      const key = dayKey(cur);
      const v = map.get(key) ?? 0;
      week.push({ date: key, value: v, level: levelOfFn(v) });

      if (cur.getDate() === 1 && cur.getMonth() !== lastMonth) {
        labels.push({
          col: out.length,
          label: cur.toLocaleString('en-US', { month: 'short' }),
        });
        lastMonth = cur.getMonth();
      }

      if (week.length === 7) {
        out.push(week);
        week = [];
      }
    }
    if (week.length > 0) out.push(week);

    return { weeks: out, levelOf: levelOfFn, monthLabels: labels };
  }, [data]);

  if (weeks.length === 0) {
    return (
      <div className={cn('rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center', className)}>
        <p className="text-sm font-medium">No activity</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The heatmap will populate once daily activity is logged.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="inline-flex flex-col gap-1.5">
        {/* Month labels */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `36px repeat(${weeks.length}, 14px)`,
            columnGap: 2,
          }}
        >
          <span />
          {weeks.map((_, col) => {
            const lbl = monthLabels.find((m) => m.col === col);
            return (
              <span key={col} className="h-3 text-[9px] uppercase tracking-wider text-muted-foreground">
                {lbl?.label ?? ''}
              </span>
            );
          })}
        </div>

        {/* Weekday rows */}
        <div className="flex gap-[2px]">
          <div className="grid grid-rows-7 gap-[2px] pr-1.5">
            {WEEKDAY_LABELS.map((d, i) => (
              <span
                key={d}
                className={cn(
                  'flex h-[14px] w-[28px] items-center text-[9px] uppercase text-muted-foreground',
                  i % 2 === 0 && 'opacity-0',
                )}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="flex gap-[2px]">
            {weeks.map((w, col) => (
              <div key={col} className="grid grid-rows-7 gap-[2px]">
                {w.map((cell) => (
                  <span
                    key={cell.date}
                    title={`${cell.date}: ${cell.value}`}
                    className={cn(
                      'h-[14px] w-[14px] rounded-[3px] transition-transform hover:scale-[1.4]',
                      RAMP[cell.level],
                    )}
                    aria-label={`${cell.date}: ${cell.value}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {RAMP.map((c, i) => (
            <span key={i} className={cn('size-3 rounded-[3px]', c)} aria-hidden />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
  // levelOf is exposed indirectly through the precomputed cells above.
  void levelOf;
}
