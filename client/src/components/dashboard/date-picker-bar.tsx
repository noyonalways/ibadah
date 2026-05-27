'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
  const tCommon = useTranslations('Common');
  const tDp = useTranslations('DatePicker');

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => onChange(shift(date, -1))}
        aria-label={tDp('previous_day')}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-2 px-1 text-center text-sm font-medium">
        <span>{prettyLabel(date)}</span>
        {atToday && (
          <span className="rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {tCommon('today')}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => onChange(shift(date, 1))}
        disabled={date >= today}
        aria-label={tDp('next_day')}
      >
        <ChevronRight className="size-4" />
      </Button>

      {!atToday && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onChange(today)}
        >
          {tCommon('today')}
        </Button>
      )}

      <DatePicker value={date} onChange={onChange} max={today} size="sm" />
    </div>
  );
}
