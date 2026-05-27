'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JummahEntry, PrayerEntry } from '@/lib/salah-api';
import type { SalahScoring } from '@/lib/user-api';

type Flag = 'sunnahBefore' | 'sunnahAfter' | 'nafl';

const TOGGLES: {
  key: Flag;
  labelKey: string;
  scoringKey: 'sunnahBefore' | 'sunnahAfter' | 'nafl';
}[] = [
  { key: 'sunnahBefore', labelKey: 'sunnah_before', scoringKey: 'sunnahBefore' },
  { key: 'sunnahAfter', labelKey: 'sunnah_after', scoringKey: 'sunnahAfter' },
  { key: 'nafl', labelKey: 'nafl', scoringKey: 'nafl' },
];

/**
 * The three independent Sunnah/Nafl toggles that appear inside both
 * `PrayerCard` and `JummahCard`. Each pill writes only its own flag —
 * the parent's onChange merges into the entry. Layout is a wrapping row
 * that reads naturally regardless of how many flags are flipped on.
 */
export function SunnahNaflToggles<T extends PrayerEntry | JummahEntry>({
  entry,
  scoring,
  onChange,
  disabled,
  Icon = Sparkles,
}: {
  entry: T;
  scoring: SalahScoring;
  onChange: (patch: Partial<T>) => void;
  disabled?: boolean;
  Icon?: LucideIcon;
}) {
  const t = useTranslations('Salah');

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {t('sunnah_nafl')}
      </span>
      <div className="flex flex-wrap gap-2">
        {TOGGLES.map((tgl) => {
          const active = entry[tgl.key as keyof T] as unknown as boolean;
          const points = scoring[tgl.scoringKey];
          return (
            <button
              key={tgl.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ [tgl.key]: !active } as Partial<T>)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all',
                active
                  ? 'bg-accent/30 text-accent-foreground ring-accent/40 shadow-sm'
                  : 'bg-background text-muted-foreground ring-border hover:bg-muted/60 hover:text-foreground',
              )}
              aria-pressed={active}
            >
              <Icon className={cn('size-3', active && 'text-accent-deep')} />
              <span>{t(tgl.labelKey)}</span>
              {points !== 0 && (
                <span
                  className={cn(
                    'tabular-nums text-[10px] font-semibold',
                    active ? 'text-accent-deep' : 'text-foreground/55',
                  )}
                >
                  {points > 0 ? '+' : ''}
                  {points}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
