'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JummahEntry, PrayerEntry, PrayerName } from '@/lib/salah/salah-api';
import type { SalahScoring } from '@/lib/user/user-api';
import {
  JUMMAH_SUNNAH_RAKAH,
  PRAYER_SUNNAH_RAKAH,
} from '@/lib/salah-defaults';

type Flag = 'sunnahBefore' | 'sunnahAfter' | 'nafl';

interface ToggleDef {
  key: Flag;
  labelKey: string;
}

const SUNNAH_TOGGLES: ToggleDef[] = [
  { key: 'sunnahBefore', labelKey: 'sunnah_before' },
  { key: 'sunnahAfter', labelKey: 'sunnah_after' },
];

const NAFL_TOGGLE: ToggleDef = { key: 'nafl', labelKey: 'nafl' };

/**
 * The independent Sunnah/Nafl toggles that appear inside both
 * `PrayerCard` and `JummahCard`.
 *
 * Per Hanafi tradition, not every waqt has both sunnah-before AND
 * sunnah-after — Fajr only has sunnah-before, Maghrib only has
 * sunnah-after, etc. This component looks up the per-prayer rakah
 * counts in `PRAYER_SUNNAH_RAKAH` (or `JUMMAH_SUNNAH_RAKAH` when
 * `jummah` is set) and HIDES the toggle for any sunnah that doesn't
 * apply (rakah count = 0). Visible toggles show their rakah count and
 * the live point payout (`<n> rakah · +<n × per-rakah pts>`).
 */
export function SunnahNaflToggles<T extends PrayerEntry | JummahEntry>({
  prayer,
  jummah = false,
  entry,
  scoring,
  onChange,
  disabled,
  Icon = Sparkles,
}: {
  /** The waqt this toggles row belongs to. Required when `jummah` is false. */
  prayer?: PrayerName;
  /** Set when this row is rendered inside the JummahCard. */
  jummah?: boolean;
  entry: T;
  scoring: SalahScoring;
  onChange: (patch: Partial<T>) => void;
  disabled?: boolean;
  Icon?: LucideIcon;
}) {
  const t = useTranslations('Salah');

  const rakah = jummah
    ? JUMMAH_SUNNAH_RAKAH
    : prayer
      ? PRAYER_SUNNAH_RAKAH[prayer]
      : { before: 0, after: 0 };

  const visibleSunnah = SUNNAH_TOGGLES.filter((tgl) =>
    tgl.key === 'sunnahBefore' ? rakah.before > 0 : rakah.after > 0,
  );

  // If the prayer has no sunnah at all (very unusual — only happens if
  // the rakah schema is patched to all-zero), still render the row so
  // Nafl stays available.
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {t('sunnah_nafl')}
      </span>
      <div className="flex flex-wrap gap-2">
        {visibleSunnah.map((tgl) => {
          const active = entry[tgl.key as keyof T] as unknown as boolean;
          const rakahCount = tgl.key === 'sunnahBefore' ? rakah.before : rakah.after;
          const perRakah =
            tgl.key === 'sunnahBefore' ? scoring.sunnahBefore : scoring.sunnahAfter;
          const totalPts = rakahCount * perRakah;
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
              aria-label={`${t(tgl.labelKey)} (${rakahCount} rakat)`}
            >
              <Icon className={cn('size-3', active && 'text-accent-deep')} />
              <span>{t(tgl.labelKey)}</span>
              <span
                className={cn(
                  'tabular-nums text-[10px] font-medium',
                  active ? 'text-accent-deep' : 'text-foreground/45',
                )}
              >
                {rakahCount} rak
              </span>
              {totalPts !== 0 && (
                <span
                  className={cn(
                    'tabular-nums text-[10px] font-semibold',
                    active ? 'text-accent-deep' : 'text-foreground/55',
                  )}
                >
                  {totalPts > 0 ? '+' : ''}
                  {totalPts}
                </span>
              )}
            </button>
          );
        })}

        {/* Nafl is always available — it's volunteer practice the user
            elects to do, not tied to a specific rakah count. */}
        {(() => {
          const active = entry[NAFL_TOGGLE.key as keyof T] as unknown as boolean;
          const points = scoring.nafl;
          return (
            <button
              key={NAFL_TOGGLE.key}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({ [NAFL_TOGGLE.key]: !active } as Partial<T>)
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all',
                active
                  ? 'bg-accent/30 text-accent-foreground ring-accent/40 shadow-sm'
                  : 'bg-background text-muted-foreground ring-border hover:bg-muted/60 hover:text-foreground',
              )}
              aria-pressed={active}
            >
              <Icon className={cn('size-3', active && 'text-accent-deep')} />
              <span>{t(NAFL_TOGGLE.labelKey)}</span>
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
        })()}
      </div>
    </div>
  );
}
