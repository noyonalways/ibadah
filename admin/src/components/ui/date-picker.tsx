'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/**
 * Public date picker. Always renders an inline button as the trigger
 * (never a native <input type="date">) and a custom Calendar as the
 * pop-up content. The value is the canonical YYYY-MM-DD day key.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  disabled,
  className,
  triggerClassName,
}: {
  value?: string;
  onChange?: (dayKey: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const display = value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : placeholder;

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
              'hover:border-primary/40',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-muted-foreground',
              triggerClassName,
            )}
            aria-label={value ? `Selected ${display}` : placeholder}
          >
            <span className="truncate text-left">{display}</span>
            <CalendarDays className="size-4 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <Calendar
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(key) => {
              onChange?.(key);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
