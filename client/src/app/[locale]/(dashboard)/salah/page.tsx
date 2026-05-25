'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { DatePickerBar } from '@/components/dashboard/date-picker-bar';
import { PrayerCard } from '@/components/salah/prayer-card';
import { useSalahDay, useToggleWitr, useUpdatePrayer } from '@/hooks/use-salah';
import { toDayKey, cn } from '@/lib/utils';
import type { PrayerName } from '@/lib/salah-api';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function SalahPage() {
  const t = useTranslations('Salah');
  const [date, setDate] = useState<string>(() => toDayKey(new Date()));

  const { data, isLoading } = useSalahDay(date);
  const updatePrayer = useUpdatePrayer(date);
  const toggleWitr = useToggleWitr(date);

  return (
    <>
      <PageHeader
        title={t('title')}
        description="Track each prayer's timing — bonuses for Sunnah/Nafil and Witr."
      />

      <DatePickerBar date={date} onChange={setDate} />

      {isLoading || !data ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between rounded-xl border bg-card px-5 py-4">
            <span className="text-sm text-muted-foreground">{t('totalPoints')}</span>
            <span
              className={cn(
                'text-2xl font-semibold tabular-nums',
                data.totalPoints > 0
                  ? 'text-primary'
                  : data.totalPoints < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground',
              )}
            >
              {data.totalPoints > 0 ? '+' : ''}
              {data.totalPoints}
            </span>
          </div>

          <div className="grid gap-4">
            {PRAYERS.map((p) => (
              <PrayerCard
                key={p}
                prayer={p}
                entry={data.prayers[p]}
                onChange={(entry) => updatePrayer.mutate({ prayer: p, entry })}
                disabled={updatePrayer.isPending}
              />
            ))}

            {/* Witr — separate from the 5 obligatory prayers */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t('witr')}</h3>
                  <p className="text-xs text-muted-foreground">+5 points bonus</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWitr.mutate(!data.witr)}
                  disabled={toggleWitr.isPending}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors',
                    data.witr
                      ? 'bg-accent/30 text-accent-foreground ring-accent/40'
                      : 'bg-muted text-muted-foreground ring-transparent hover:ring-border',
                  )}
                  aria-pressed={data.witr}
                >
                  <Sparkles className="size-4" />
                  {data.witr ? 'Performed' : 'Mark performed'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
