'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A polished number stepper with +/- buttons. Used for "pages read",
 * "minutes read", scoring overrides, etc. Calls onChange on every nudge.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  size = 'md',
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const set = (next: number) => onChange(Math.max(min, Math.min(max, next)));
  const sizeClasses = {
    sm: { btn: 'size-8', value: 'text-base min-w-[2.5rem]' },
    md: { btn: 'size-10', value: 'text-2xl min-w-[3.5rem]' },
    lg: { btn: 'size-12', value: 'text-4xl min-w-[5rem]' },
  }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/60 p-1 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        className={cn(
          'grid place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground',
          sizeClasses.btn,
        )}
        aria-label="decrement"
      >
        <Minus className="size-4" />
      </button>

      <span className="flex items-baseline justify-center gap-1.5">
        <span
          className={cn(
            'text-center font-bold tabular-nums tracking-tight',
            sizeClasses.value,
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{unit}</span>}
      </span>

      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        className={cn(
          'grid place-items-center rounded-full bg-gradient-to-br from-primary to-primary-soft text-primary-foreground shadow-sm transition-all hover:shadow-md hover:shadow-primary/30 disabled:opacity-40',
          sizeClasses.btn,
        )}
        aria-label="increment"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
