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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePickerBar({ date, onChange }: Props) {
  const today = toDayKey(new Date());
  const atToday = isToday(date);

  return (
    <div className="mb-6 flex items-center gap-2 rounded-xl border bg-card p-2">
      <Button variant="ghost" size="icon" onClick={() => onChange(shift(date, -1))}>
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex flex-1 items-center justify-center gap-2 text-sm font-medium">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span>{prettyLabel(date)}</span>
        {atToday && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Today</span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(shift(date, 1))}
        disabled={date >= today}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>

      {!atToday && (
        <Button variant="outline" size="sm" onClick={() => onChange(today)}>
          Today
        </Button>
      )}

      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="ml-1 rounded-md border bg-background px-2 py-1.5 text-xs"
        aria-label="Pick a date"
      />
    </div>
  );
}
