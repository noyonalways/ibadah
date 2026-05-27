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
      <PageHeader title={t('title')} description={t('description')} />

      <DatePickerBar date={date} onChange={setDate} />

      {isLoading || !data ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Total points hero */}
          <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
            <div
              className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t('totalPoints')}
                </p>
                <p
                  className={cn(
                    'mt-1 text-4xl font-bold tabular-nums tracking-tight',
                    data.totalPoints > 0
                      ? 'text-gradient'
                      : data.totalPoints < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                  )}
                >
                  {data.totalPoints > 0 ? '+' : ''}
                  {data.totalPoints}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t('maxToday')}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {t('max_value_175')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PRAYERS.map((p) => (
              <PrayerCard
                key={p}
                prayer={p}
                entry={data.prayers[p]}
                onChange={(entry) => updatePrayer.mutate({ prayer: p, entry })}
                disabled={updatePrayer.isPending}
              />
            ))}
          </div>

          {/* Witr — special card */}
          <button
            type="button"
            onClick={() => toggleWitr.mutate(!data.witr)}
            disabled={toggleWitr.isPending}
            className={cn(
              'group relative mt-4 flex w-full items-center justify-between overflow-hidden rounded-2xl border p-6 text-left transition-all',
              data.witr
                ? 'border-accent/40 bg-gradient-to-br from-accent/15 via-card to-card shadow-md shadow-accent/10'
                : 'border-border/60 bg-card hover:border-accent/30 hover:shadow-md hover:shadow-accent/5',
            )}
            aria-pressed={data.witr}
          >
            <div
              className={cn(
                'pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl transition-opacity',
                data.witr
                  ? 'bg-accent/30 opacity-100'
                  : 'bg-accent/20 opacity-0 group-hover:opacity-60',
              )}
              aria-hidden
            />
            <div className="relative flex items-center gap-4">
              <span
                className={cn(
                  'grid size-12 place-items-center rounded-xl transition-colors',
                  data.witr
                    ? 'bg-gradient-to-br from-accent to-accent-deep text-accent-foreground shadow-md'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight">{t('witr')}</p>
                <p className="text-xs text-muted-foreground">{t('witr_desc')}</p>
              </div>
            </div>
            <span
              className={cn(
                'relative rounded-full px-4 py-1.5 text-xs font-medium ring-1 ring-inset',
                data.witr
                  ? 'bg-accent text-accent-foreground ring-accent'
                  : 'bg-background text-muted-foreground ring-border',
              )}
            >
              {data.witr ? t('witr_performed') : t('witr_mark')}
            </span>
          </button>
        </>
      )}
    </>
  );
}
