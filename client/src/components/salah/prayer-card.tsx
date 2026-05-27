'use client';

import { useTranslations } from 'next-intl';
import { Sun, Sunrise, Sunset, MoonStar, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PrayerEntry,
  PrayerName,
  PrayerStatus,
} from '@/lib/salah-api';
import type { SalahScoring } from '@/lib/user-api';
import { SunnahNaflToggles } from '@/components/salah/sunnah-nafl-toggles';

const PRAYER_META: Record<
  PrayerName,
  { icon: LucideIcon; gradient: string; ring: string }
> = {
  fajr: {
    icon: Sunrise,
    gradient: 'bg-prayer-fajr',
    ring: 'ring-rose-200/40 dark:ring-rose-300/20',
  },
  dhuhr: {
    icon: Sun,
    gradient: 'bg-prayer-dhuhr',
    ring: 'ring-amber-200/40 dark:ring-amber-300/20',
  },
  asr: {
    icon: Sun,
    gradient: 'bg-prayer-asr',
    ring: 'ring-orange-200/40 dark:ring-orange-300/20',
  },
  maghrib: {
    icon: Sunset,
    gradient: 'bg-prayer-maghrib',
    ring: 'ring-fuchsia-200/40 dark:ring-fuchsia-300/20',
  },
  isha: {
    icon: MoonStar,
    gradient: 'bg-prayer-isha',
    ring: 'ring-indigo-200/40 dark:ring-indigo-300/20',
  },
};

const STATUS_OPTIONS: {
  value: PrayerStatus;
  labelKey: string;
  scoringKey: keyof Pick<
    SalahScoring,
    'fardAwwal' | 'fardMid' | 'fardLast' | 'fardLate' | 'fardMissed'
  >;
  tone?: 'default' | 'destructive';
}[] = [
  { value: 'on_time_awwal', labelKey: 'status_awwal', scoringKey: 'fardAwwal' },
  { value: 'on_time_mid', labelKey: 'status_mid', scoringKey: 'fardMid' },
  { value: 'on_time_last', labelKey: 'status_last', scoringKey: 'fardLast' },
  { value: 'late', labelKey: 'status_late', scoringKey: 'fardLate' },
  {
    value: 'missed',
    labelKey: 'status_missed',
    scoringKey: 'fardMissed',
    tone: 'destructive',
  },
];

interface Props {
  prayer: PrayerName;
  entry: PrayerEntry;
  scoring: SalahScoring;
  onChange: (entry: Partial<PrayerEntry>) => void;
  disabled?: boolean;
}

export function PrayerCard({ prayer, entry, scoring, onChange, disabled }: Props) {
  const t = useTranslations('Salah');
  const meta = PRAYER_META[prayer];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-lg hover:shadow-primary/5',
      )}
    >
      {/* Mood band — the gradient signature for this prayer */}
      <div className={cn('relative h-24 px-5 py-4 text-white', meta.gradient)}>
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0px, transparent 1.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div
          className="absolute -bottom-12 -right-12 size-36 rounded-full bg-white/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />

        <div className="relative flex h-full items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'grid size-8 place-items-center rounded-lg bg-white/15 ring-1 ring-inset',
                meta.ring,
              )}
            >
              <Icon className="size-4" />
            </span>
            <h3 className="text-xl font-semibold capitalize tracking-tight">{t(prayer)}</h3>
          </div>

          {/* Tiny "Fard" eyebrow so the user knows what the timing pills below
              refer to. The Sunnah/Nafl toggles get their own labelled row. */}
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]">
            {t('fard')}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Fard timing pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = entry.fard.status === opt.value;
            const points = scoring[opt.scoringKey];
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    fard: { status: active ? 'pending' : opt.value },
                  })
                }
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-all',
                  active
                    ? 'bg-foreground text-background ring-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground ring-transparent hover:bg-muted hover:text-foreground hover:ring-border',
                  opt.tone === 'destructive' &&
                    active &&
                    'bg-destructive ring-destructive text-destructive-foreground',
                )}
                aria-pressed={active}
              >
                <span>{t(opt.labelKey)}</span>
                <PointBadge value={points} active={active} tone={opt.tone} />
              </button>
            );
          })}
        </div>

        {/* Independent toggles for sunnah-before, sunnah-after, nafl —
            only the toggles relevant for THIS prayer (per Hanafi rakah
            counts) are rendered, and each shows the live point payout. */}
        <SunnahNaflToggles
          prayer={prayer}
          entry={entry}
          scoring={scoring}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * Tiny badge shown next to a status pill. Hides when points are 0
 * (Late defaults to 0) so the UI doesn't get noisy.
 */
function PointBadge({
  value,
  active,
  tone,
}: {
  value: number;
  active: boolean;
  tone?: 'default' | 'destructive';
}) {
  if (value === 0) return null;
  const sign = value > 0 ? '+' : '';
  return (
    <span
      className={cn(
        'tabular-nums text-[10px] font-semibold',
        active
          ? tone === 'destructive'
            ? 'text-destructive-foreground/90'
            : 'text-background/80'
          : value < 0
            ? 'text-destructive/80'
            : 'text-foreground/60',
      )}
    >
      {sign}
      {value}
    </span>
  );
}
