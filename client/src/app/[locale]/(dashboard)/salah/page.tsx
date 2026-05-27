'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { DatePickerBar } from '@/components/dashboard/date-picker-bar';
import { PrayerCard } from '@/components/salah/prayer-card';
import { JummahCard } from '@/components/salah/jummah-card';
import {
  useSalahDay,
  useToggleWitr,
  useUpdateJummah,
  useUpdatePrayer,
} from '@/hooks/use-salah';
import { useProfile } from '@/hooks/use-user';
import { toDayKey, cn } from '@/lib/utils';
import { emptyJummahEntry, type PrayerName } from '@/lib/salah-api';
import { maxDailyPoints } from '@/lib/salah-scoring';
import { SALAH_DEFAULT_SCORING } from '@/lib/salah-defaults';

const NON_DHUHR_PRAYERS: PrayerName[] = ['fajr', 'asr', 'maghrib', 'isha'];

export default function SalahPage() {
  const t = useTranslations('Salah');
  const [date, setDate] = useState<string>(() => toDayKey(new Date()));

  const { data, isLoading } = useSalahDay(date);
  const { data: profile } = useProfile();
  const updatePrayer = useUpdatePrayer(date);
  const updateJummah = useUpdateJummah(date);
  const toggleWitr = useToggleWitr(date);

  // Fall back to default scoring while the profile is loading so the
  // first paint of the cards has sensible point labels rather than
  // jumping when the profile resolves.
  const scoring = profile?.scoring ?? SALAH_DEFAULT_SCORING;
  const isFriday = data?.isFriday ?? false;
  const maxToday = maxDailyPoints(scoring, isFriday);

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
                <p className="mt-1 text-sm font-medium text-muted-foreground tabular-nums">
                  {t('points_value', { value: maxToday })}
                </p>
                {isFriday && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-accent-foreground/80">
                    {t('friday_label')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fajr in its own row when Jummah card spans full width on Fridays;
              otherwise the standard 2-column grid for all five waqts. */}
          {isFriday ? (
            <div className="space-y-4">
              {/* Fajr first (chronological), then Jummah (full-width), then
                  the rest of the waqts. */}
              <div className="grid gap-4 md:grid-cols-2">
                <PrayerCard
                  prayer="fajr"
                  entry={data.prayers.fajr}
                  scoring={scoring}
                  onChange={(entry) =>
                    updatePrayer.mutate({ prayer: 'fajr', entry })
                  }
                  disabled={updatePrayer.isPending}
                />
                <FridayBanner />
              </div>

              <JummahCard
                entry={data.jummah ?? emptyJummahEntry()}
                scoring={scoring}
                onChange={(entry) => updateJummah.mutate(entry)}
                disabled={updateJummah.isPending}
              />

              <div className="grid gap-4 md:grid-cols-2">
                {(['asr', 'maghrib', 'isha'] as PrayerName[]).map((p) => (
                  <PrayerCard
                    key={p}
                    prayer={p}
                    entry={data.prayers[p]}
                    scoring={scoring}
                    onChange={(entry) => updatePrayer.mutate({ prayer: p, entry })}
                    disabled={updatePrayer.isPending}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(['fajr', 'dhuhr', ...NON_DHUHR_PRAYERS.slice(1)] as PrayerName[]).map(
                (p) => (
                  <PrayerCard
                    key={p}
                    prayer={p}
                    entry={data.prayers[p]}
                    scoring={scoring}
                    onChange={(entry) => updatePrayer.mutate({ prayer: p, entry })}
                    disabled={updatePrayer.isPending}
                  />
                ),
              )}
            </div>
          )}

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
                <p className="text-xs text-muted-foreground">
                  {t('witr_desc', { value: scoring.witr })}
                </p>
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

/**
 * Small "It's Friday" hint that sits next to the Fajr card on the
 * Friday layout, above the full-width Jummah card.
 */
function FridayBanner() {
  const t = useTranslations('Salah');
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-5">
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-foreground/80">
          {t('friday_label')}
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight">
          {t('friday_banner_title')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('friday_banner_desc')}
        </p>
      </div>
    </div>
  );
}
