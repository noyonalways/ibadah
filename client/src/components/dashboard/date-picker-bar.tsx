'use client';

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toDayKey } from '@/lib/utils';

interface Props {
  date: string; // YYYY-MM-DD
  onChange: (next: string) => void;
}

function shift(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

function isToday(date: string): boolean {
  return date === toDayKey(new Date());
}

function prettyLabel(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePickerBar({ date, onChange }: Props) {
  const today = toDayKey(new Date());
  const atToday = isToday(date);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm backdrop-blur">
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onChange(shift(date, -1))}>
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex flex-1 items-center justify-center gap-2 text-sm font-medium">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span>{prettyLabel(date)}</span>
        {atToday && (
          <span className="rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Today
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => onChange(shift(date, 1))}
        disabled={date >= today}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>

      {!atToday && (
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => onChange(today)}>
          Today
        </Button>
      )}

      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="ml-1 rounded-full border bg-background px-3 py-1.5 text-xs"
        aria-label="Pick a date"
      />
    </div>
  );
}
