'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Self-contained month calendar grid. Zero external date library — uses
 * the platform `Date` and produces stable visuals via simple arithmetic.
 *
 * The "value" is a YYYY-MM-DD string (the same key the API uses) so
 * callers don't need to think about timezones; the internal Date logic
 * is purely month-grid math.
 */

interface CalendarProps {
  /** Selected day, as YYYY-MM-DD. */
  value?: string;
  onChange?: (dayKey: string) => void;
  /** Lower bound (YYYY-MM-DD), inclusive. */
  minDate?: string;
  /** Upper bound (YYYY-MM-DD), inclusive. */
  maxDate?: string;
  className?: string;
}

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parse(s?: string): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function startOfMonthGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // back to Sunday
  return start;
}

export function Calendar({ value, onChange, minDate, maxDate, className }: CalendarProps) {
  const today = React.useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const initial = parse(value) ?? today;
  const [view, setView] = React.useState({ year: initial.getFullYear(), month: initial.getMonth() });

  // Re-anchor view when an external `value` change moves to a different month.
  React.useEffect(() => {
    const v = parse(value);
    if (v && (v.getFullYear() !== view.year || v.getMonth() !== view.month)) {
      setView({ year: v.getFullYear(), month: v.getMonth() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const min = parse(minDate);
  const max = parse(maxDate);

  const days: Date[] = React.useMemo(() => {
    const start = startOfMonthGrid(view.year, view.month);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const stepMonth = (delta: number) => {
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const monthLabel = new Date(view.year, view.month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isDisabled = (d: Date) => {
    if (min && d < min) return true;
    if (max && d > max) return true;
    return false;
  };

  return (
    <div className={cn('w-[18rem] select-none', className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => stepMonth(-1)}
          aria-label="Previous month"
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold tracking-tight tabular-nums">{monthLabel}</p>
        <button
          type="button"
          onClick={() => stepMonth(1)}
          aria-label="Next month"
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEK_LABELS.map((label) => (
          <p
            key={label}
            className="py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            {label[0]}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = d.getMonth() === view.month;
          const key = fmt(d);
          const selected = key === value;
          const isToday = key === fmt(today);
          const disabled = isDisabled(d);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(key)}
              aria-pressed={selected}
              className={cn(
                'relative grid h-9 place-items-center rounded-md text-sm font-medium tabular-nums transition-colors',
                disabled && 'cursor-not-allowed opacity-30',
                !disabled && 'hover:bg-muted/60',
                !inMonth && 'text-muted-foreground/50',
                selected &&
                  'bg-primary text-primary-foreground shadow-sm hover:bg-primary',
                !selected && isToday && 'ring-1 ring-inset ring-primary/40',
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
