'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { HadithCard } from './hadith-card';
import type { HadithEntry } from '@/lib/hadith/hadith-api';

interface Props {
  arabic: HadithEntry | null;
  translation: HadithEntry | null;
  bookName: string;
  sectionName?: string;
  /** ISO date string for the picked day. */
  dayKey: string;
}

/**
 * "Hadith of the Day" hero. Picked deterministically from the active
 * book's narrations using `pickHadithOfTheDay(edition, dayKey)` so the
 * value is shareable and stable across users for any given date+book.
 */
export function HadithOfTheDay({
  arabic,
  translation,
  bookName,
  sectionName,
  dayKey,
}: Props) {
  const t = useTranslations('Hadith');

  const formatted = new Date(dayKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-5 md:p-7">
      <GeometricPattern className="text-primary" opacity={0.05} />
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-12 bottom-0 size-40 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 px-3 py-1 text-[11px] font-medium text-foreground/80 ring-1 ring-inset ring-primary/20">
            <Sparkles className="size-3.5 text-primary" />
            {t('of_the_day')}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {formatted}
          </span>
        </div>

        <HadithCard
          arabic={arabic}
          translation={translation}
          bookName={bookName}
          sectionName={sectionName}
          compact
          className="border-transparent bg-card/80 shadow-sm backdrop-blur"
        />
      </div>
    </div>
  );
}
