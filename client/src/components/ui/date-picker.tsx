'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (next: string) => void;
  max?: string;
  min?: string;
  locale?: string;
  /** Optional override label; defaults to localized date. */
  label?: React.ReactNode;
  className?: string;
  /** Visual size of the trigger. */
  size?: 'sm' | 'md';
}

/**
 * Trigger button + popover-anchored calendar. Replaces the native
 * `<input type="date">` so the date-picking experience is identical
 * across browsers and platforms — and matches our visual language.
 */
export function DatePicker({
  value,
  onChange,
  max,
  min,
  locale,
  label,
  className,
  size = 'md',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const display =
    label ??
    new Date(value).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const sizeClass = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-xs';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-border bg-background font-medium text-foreground transition-colors hover:bg-muted/60',
            sizeClass,
            className,
          )}
        >
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <span>{display}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px]">
        <Calendar
          value={value}
          onChange={(d) => {
            onChange(d);
            setOpen(false);
          }}
          max={max}
          min={min}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}
