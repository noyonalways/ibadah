'use client';

import { useTranslations } from 'next-intl';
import { BookMarked, Hash } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { HadithEntry, HadithGrade } from '@/lib/hadith-api';

interface Props {
  /** Arabic narration. May be null only on data integrity errors. */
  arabic: HadithEntry | null;
  /** Translation in the user's locale, or null for ar users. */
  translation: HadithEntry | null;
  /** Display name of the book in the user's locale. */
  bookName: string;
  /** Title of the section the hadith belongs to. */
  sectionName?: string;
  /** Compact mode for the "Hadith of the day" hero context. */
  compact?: boolean;
  className?: string;
}

/**
 * Single hadith card. Shows Arabic at the top in larger serif type
 * (`dir="rtl"`), the user's translation below, and a footer with the
 * canonical citation (book → section → hadith number) plus any
 * authenticity grades. The grade badges use semantic tones so users
 * get an immediate read on reliability without needing to know the
 * Arabic terminology — Sahih → success, Hasan → accent, Daif/Maudu
 * → destructive.
 */
export function HadithCard({
  arabic,
  translation,
  bookName,
  sectionName,
  compact = false,
  className,
}: Props) {
  const t = useTranslations('Hadith');

  // The "primary" entry for citation: prefer the translation entry if
  // we have one (matches what the user is reading), else Arabic.
  const cite = translation ?? arabic;
  const number = cite?.hadithnumber;

  return (
    <Card className={cn('border-border/60', className)}>
      <CardContent className={cn('space-y-4', compact ? 'p-5' : 'p-6')}>
        {/* Arabic text — always shown at the top */}
        {arabic ? (
          <p
            dir="rtl"
            lang="ar"
            className={cn(
              'font-serif leading-loose text-foreground',
              compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl',
            )}
          >
            {arabic.text}
          </p>
        ) : null}

        {/* Translation — shown only when we have a separate edition */}
        {translation ? (
          <>
            <div className="h-px bg-border/50" aria-hidden />
            <p
              className={cn(
                'leading-relaxed text-foreground/90',
                compact ? 'text-sm md:text-base' : 'text-base md:text-[1.05rem]',
              )}
            >
              {translation.text}
            </p>
          </>
        ) : null}

        {/* Source citation */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <BookMarked className="size-3.5" />
            <span className="font-medium text-foreground">{bookName}</span>
          </span>
          {sectionName ? (
            <span className="text-muted-foreground">
              <span className="text-muted-foreground/70">{t('section_label')}:</span>{' '}
              <span className="text-foreground/90">{sectionName}</span>
            </span>
          ) : null}
          {number !== undefined ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
              <Hash className="size-3.5" />
              {number}
            </span>
          ) : null}
        </div>

        {/* Grades — render only the de-duplicated grades for clarity */}
        {cite?.grades && cite.grades.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {dedupeGrades(cite.grades).map((g, i) => (
              <Badge key={i} variant={gradeTone(g.grade)} className="text-[10px] uppercase tracking-wider">
                {g.grade}
                {g.name ? (
                  <span className="ml-1.5 font-normal opacity-70">· {g.name}</span>
                ) : null}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Map a grade text to a Badge tone. Recognises the most common terms
 * across the Kutub as-Sittah graders (Darussalam, al-Albani, Zubair Ali
 * Zai, …). Anything we don't recognise falls back to `outline` so the
 * grade is still visible without making a reliability claim.
 */
function gradeTone(
  grade: string,
):
  | 'success'
  | 'accent'
  | 'destructive'
  | 'outline'
  | 'default'
  | 'secondary' {
  const g = grade.toLowerCase();
  if (g.includes('sahih') || g.includes('saheeh') || g.includes('authentic')) {
    return 'success';
  }
  if (g.includes('hasan') || g.includes('good')) {
    return 'accent';
  }
  if (
    g.includes('daif') ||
    g.includes("da'if") ||
    g.includes('weak') ||
    g.includes('munkar') ||
    g.includes('maudu') ||
    g.includes('fabricated')
  ) {
    return 'destructive';
  }
  return 'outline';
}

/**
 * Multiple graders sometimes report the same verdict. Collapse exact
 * duplicate (name, grade) pairs and identical grades from different
 * graders into a single, more readable row.
 */
function dedupeGrades(grades: HadithGrade[]): HadithGrade[] {
  const seen = new Set<string>();
  const out: HadithGrade[] = [];
  for (const g of grades) {
    const key = `${(g.name ?? '').toLowerCase()}::${g.grade.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}
