'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrayerEntry, PrayerName, PrayerStatus } from '@/lib/salah-api';

const STATUS_OPTIONS: { value: PrayerStatus; tone: 'good' | 'mid' | 'soft' | 'warn' | 'bad' }[] = [
  { value: 'on_time_awwal', tone: 'good' },
  { value: 'on_time_mid', tone: 'mid' },
  { value: 'on_time_last', tone: 'soft' },
  { value: 'late', tone: 'warn' },
  { value: 'missed', tone: 'bad' },
];

const TONE_CLASSES: Record<string, string> = {
  good: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30',
  mid: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-200 ring-emerald-400/30',
  soft: 'bg-amber-400/15 text-amber-700 dark:text-amber-200 ring-amber-400/30',
  warn: 'bg-orange-400/15 text-orange-700 dark:text-orange-200 ring-orange-400/30',
  bad: 'bg-destructive/15 text-destructive ring-destructive/30',
};

interface Props {
  prayer: PrayerName;
  entry: PrayerEntry;
  onChange: (entry: Partial<PrayerEntry>) => void;
  disabled?: boolean;
}

export function PrayerCard({ prayer, entry, onChange, disabled }: Props) {
  const t = useTranslations('Salah');

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{t(prayer)}</h3>
        <button
          type="button"
          onClick={() => onChange({ sunnahNafil: !entry.sunnahNafil })}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
            entry.sunnahNafil
              ? 'bg-accent/30 text-accent-foreground ring-accent/40'
              : 'bg-muted text-muted-foreground ring-transparent hover:ring-border',
          )}
          aria-pressed={entry.sunnahNafil}
        >
          <Sparkles className="size-3" />
          {t('sunnahNafil')} {entry.sunnahNafil ? '+5' : ''}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = entry.status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ status: opt.value })}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all',
                active
                  ? TONE_CLASSES[opt.tone]
                  : 'bg-muted text-muted-foreground ring-transparent hover:ring-border',
              )}
            >
              {t(`status_${opt.value}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
