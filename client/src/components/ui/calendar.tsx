'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  /** Selected date in YYYY-MM-DD format. */
  value?: string;
  /** Called when the user picks a day, in YYYY-MM-DD format. */
  onChange?: (date: string) => void;
  /** Inclusive maximum selectable date (YYYY-MM-DD). Defaults to today. */
  max?: string;
  /** Inclusive minimum selectable date (YYYY-MM-DD). */
  min?: string;
  /** Locale for month / day-name labels. */
  locale?: string;
  /** First day of the week. 0 = Sunday, 1 = Monday. Defaults to 0. */
  weekStartsOn?: 0 | 1;
  className?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toLocalKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * A compact, accessible monthly calendar grid. No external date library used —
 * just `Date` and the browser's `Intl` API for localized labels.
 */
export function Calendar({
  value,
  onChange,
  max,
  min,
  locale,
  weekStartsOn = 0,
  className,
}: CalendarProps) {
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = max ? parseKey(max) : today;
  const minDate = min ? parseKey(min) : null;

  // Active month — defaults to the month of the selected value, else today.
  const initialAnchor = value ? parseKey(value) : today;
  const [view, setView] = React.useState<{ year: number; month: number }>({
    year: initialAnchor.getFullYear(),
    month: initialAnchor.getMonth(),
  });

  // Re-anchor when an externally-controlled value changes.
  React.useEffect(() => {
    if (!value) return;
    const d = parseKey(value);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }, [value]);

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  // Build localized weekday labels. Take a known week (Sun..Sat) and rotate.
  const weekdayLabels = React.useMemo(() => {
    const base: string[] = [];
    // Reference: Sunday Jan 5 2025 .. Saturday Jan 11 2025
    for (let i = 0; i < 7; i++) {
      base.push(
        new Date(2025, 0, 5 + i).toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2),
      );
    }
    return weekStartsOn === 1 ? [...base.slice(1), base[0]] : base;
  }, [locale, weekStartsOn]);

  // Build the 6×7 grid of day cells.
  const cells: { date: Date; inMonth: boolean }[] = React.useMemo(() => {
    const firstOfMonth = new Date(view.year, view.month, 1);
    const startOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startOffset);

    return Array.from({ length: 42 }).map((_, i) => {
      const date = new Date(gridStart.getTime() + i * DAY_MS);
      return { date, inMonth: date.getMonth() === view.month };
    });
  }, [view.year, view.month, weekStartsOn]);

  const goPrev = () => {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  };
  const goNext = () => {
    // Block jumping past the max month.
    const next = new Date(view.year, view.month + 1, 1);
    if (next > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  };
  const isNextDisabled =
    new Date(view.year, view.month + 1, 1) >
    new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const selectedDate = value ? parseKey(value) : null;

  return (
    <div className={cn('p-3 select-none', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={goPrev}
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold tracking-tight">{monthLabel}</p>
        <button
          type="button"
          onClick={goNext}
          disabled={isNextDisabled}
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 px-1 pb-1">
        {weekdayLabels.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {cells.map(({ date, inMonth }) => {
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);
          const tooLate = date > maxDate;
          const tooEarly = minDate ? date < minDate : false;
          const disabled = tooLate || tooEarly;

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(toLocalKey(date))}
              className={cn(
                'relative grid h-9 w-9 place-items-center rounded-full text-sm tabular-nums transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                disabled
                  ? 'cursor-not-allowed text-muted-foreground/30'
                  : 'hover:bg-muted active:scale-95',
                !inMonth && !disabled && 'text-muted-foreground/50',
                isSelected &&
                  'bg-gradient-to-br from-primary to-primary-soft text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary',
                !isSelected && isToday && 'font-semibold ring-1 ring-inset ring-primary/40',
              )}
              aria-pressed={isSelected}
              aria-label={date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            >
              {date.getDate()}
              {isToday && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
