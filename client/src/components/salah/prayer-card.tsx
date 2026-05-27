'use client';

import { useTranslations } from 'next-intl';
import { Sun, Sunrise, Sunset, MoonStar, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrayerEntry, PrayerName, PrayerStatus } from '@/lib/salah-api';

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

const STATUS_OPTIONS: { value: PrayerStatus; labelKey: string }[] = [
  { value: 'on_time_awwal', labelKey: 'status_awwal_short' },
  { value: 'on_time_mid', labelKey: 'status_mid_short' },
  { value: 'on_time_last', labelKey: 'status_last_short' },
  { value: 'late', labelKey: 'status_late_short' },
  { value: 'missed', labelKey: 'status_missed_short' },
];

interface Props {
  prayer: PrayerName;
  entry: PrayerEntry;
  onChange: (entry: Partial<PrayerEntry>) => void;
  disabled?: boolean;
}

export function PrayerCard({ prayer, entry, onChange, disabled }: Props) {
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
      <div
        className={cn('relative h-24 px-5 py-4 text-white', meta.gradient)}
      >
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
            <span className={cn('grid size-8 place-items-center rounded-lg bg-white/15 ring-1 ring-inset', meta.ring)}>
              <Icon className="size-4" />
            </span>
            <h3 className="text-xl font-semibold capitalize tracking-tight">{t(prayer)}</h3>
          </div>

          <button
            type="button"
            onClick={() => onChange({ sunnahNafil: !entry.sunnahNafil })}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur transition-all',
              entry.sunnahNafil ? 'bg-white/35' : 'hover:bg-white/20',
            )}
            aria-pressed={entry.sunnahNafil}
          >
            <Sparkles className="size-3" />
            {t('sunnahNafil')}
            {entry.sunnahNafil && <span className="font-semibold">+5</span>}
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 p-5">
        {STATUS_OPTIONS.map((opt) => {
          const active = entry.status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ status: opt.value })}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ring-1 ring-inset',
                active
                  ? 'bg-foreground text-background ring-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground ring-transparent hover:bg-muted hover:text-foreground hover:ring-border',
                opt.value === 'missed' &&
                  active &&
                  'bg-destructive ring-destructive text-destructive-foreground',
              )}
            >
              {t(opt.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
