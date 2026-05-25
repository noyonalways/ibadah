'use client';

import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

const VERSES = [
  {
    arabic: 'أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
    en: 'Verily, in the remembrance of Allah do hearts find rest.',
    cite: 'Surah Ar-Ra\u2019d · 13:28',
  },
  {
    arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ',
    en: 'So remember Me; I will remember you.',
    cite: 'Surah Al-Baqarah · 2:152',
  },
  {
    arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا',
    en: 'Verily, with hardship comes ease.',
    cite: 'Surah Ash-Sharh · 94:6',
  },
  {
    arabic: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًۭا',
    en: 'And whoever fears Allah, He will make for him a way out.',
    cite: 'Surah At-Talaq · 65:2',
  },
];

export function QuoteCard() {
  const [verse, setVerse] = useState(VERSES[0]);

  useEffect(() => {
    // Rotate based on day-of-year so it's stable per day
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    setVerse(VERSES[dayOfYear % VERSES.length]);
  }, []);

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-tertiary/5">
      <GeometricPattern className="text-tertiary" opacity={0.05} />
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-tertiary/15 blur-3xl"
        aria-hidden
      />
      <CardContent className="relative p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-tertiary/15 text-tertiary">
            <Quote className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Verse of the day
            </p>
            <p
              className="font-display mt-3 text-2xl leading-[1.7] text-foreground/90"
              dir="rtl"
              lang="ar"
            >
              {verse.arabic}
            </p>
            <p className="mt-3 text-sm italic text-muted-foreground">&ldquo;{verse.en}&rdquo;</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
              {verse.cite}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
