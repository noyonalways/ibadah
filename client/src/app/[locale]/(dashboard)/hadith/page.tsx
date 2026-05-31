'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Loader2, ScrollText, TriangleAlert } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { BookPicker } from '@/components/hadith/book-picker';
import { SectionJumper, ALL_SECTIONS } from '@/components/hadith/section-jumper';
import { HadithCard } from '@/components/hadith/hadith-card';
import { HadithOfTheDay } from '@/components/hadith/hadith-of-the-day';
import { Button } from '@/components/ui/button';
import { useHadithBookBilingual } from '@/hooks/use-hadith';
import {
  hadithsInSection,
  KUTUB_AS_SITTAH,
  pickHadithOfTheDay,
  type HadithBookSlug,
  type HadithEntry,
  type HadithSectionDetail,
} from '@/lib/hadith-api';
import { toDayKey } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function HadithPage() {
  const t = useTranslations('Hadith');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  const [book, setBook] = React.useState<HadithBookSlug>('bukhari');
  const [sectionKey, setSectionKey] = React.useState<string>(ALL_SECTIONS);
  const [page, setPage] = React.useState(0);

  const { loading, error, primary, arabicFor, hasTranslation } =
    useHadithBookBilingual(book, locale);

  // Reset section + page whenever the user picks a different book.
  React.useEffect(() => {
    setSectionKey(ALL_SECTIONS);
    setPage(0);
  }, [book]);
  // Reset only the page when changing section within the same book.
  React.useEffect(() => {
    setPage(0);
  }, [sectionKey]);

  const allEntries = primary?.hadiths ?? [];

  // Slice down to the current section if one is picked.
  const sectionEntries = React.useMemo<HadithEntry[]>(() => {
    if (!primary || sectionKey === ALL_SECTIONS) return allEntries;
    const detail: HadithSectionDetail | undefined =
      primary.metadata.section_details[sectionKey];
    if (!detail) return [];
    return hadithsInSection(primary, detail);
  }, [primary, sectionKey, allEntries]);

  // Page slice.
  const totalPages = Math.max(1, Math.ceil(sectionEntries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageEntries = React.useMemo(
    () => sectionEntries.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [sectionEntries, safePage],
  );

  const dayKey = toDayKey(new Date());

  // Hadith-of-the-day uses the Arabic edition as the canonical
  // numbering source; we then look up the translation by that number.
  const hotd = React.useMemo(() => {
    if (!primary) return null;
    // For ar locale primary == arabic, so this works either way.
    const arabicEntry = pickHadithOfTheDay(primary, dayKey);
    if (!arabicEntry) return null;
    return arabicEntry;
  }, [primary, dayKey]);

  const bookMeta = KUTUB_AS_SITTAH.find((b) => b.slug === book)!;
  const localizedBookName = primary?.metadata.name ?? t(`books.${bookMeta.titleKey}`);

  const sectionTitleFor = (entry: HadithEntry): string | undefined => {
    if (!primary) return undefined;
    const sectionId = String(entry.reference.book);
    return primary.metadata.sections[sectionId] || undefined;
  };

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {/* Pickers */}
      <div className="mb-6 grid gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur sm:grid-cols-2">
        <BookPicker id="hadith-book" value={book} onChange={setBook} />
        <SectionJumper
          id="hadith-section"
          meta={primary?.metadata ?? null}
          value={sectionKey}
          onChange={setSectionKey}
        />
      </div>

      {/* Loading / error states gate the rest of the page */}
      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="mt-3 text-xs uppercase tracking-[0.18em]">
            {t('loading_book', { book: t(`books.${bookMeta.titleKey}`) })}
          </p>
        </div>
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !primary || allEntries.length === 0 ? (
        <ErrorState message={t('empty_state')} />
      ) : (
        <>
          {/* Hadith of the day — only when no section is filtered (i.e. the
              user is browsing the whole book), so the daily pick reads as
              the day's pick rather than "first hadith of the section". */}
          {sectionKey === ALL_SECTIONS && hotd ? (
            <HadithOfTheDay
              arabic={arabicFor(hotd) ?? hotd}
              translation={hasTranslation ? hotd : null}
              bookName={localizedBookName}
              sectionName={sectionTitleFor(hotd)}
              dayKey={dayKey}
            />
          ) : null}

          {/* Page meta + count summary */}
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 px-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{localizedBookName}</span>
              <span className="mx-2 text-muted-foreground/40">·</span>
              <span className="tabular-nums">
                {t('count_summary', {
                  count: sectionEntries.length,
                })}
              </span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t('page_indicator', {
                current: safePage + 1,
                total: totalPages,
              })}
            </p>
          </div>

          {/* Top pagination */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            tCommon={tCommon}
          />

          {/* Hadith list */}
          <div className="space-y-4">
            {pageEntries.length === 0 ? (
              <p className="grid place-items-center rounded-xl border border-dashed border-border/60 py-16 text-sm text-muted-foreground">
                <ScrollText className="mb-2 size-5" />
                {t('section_empty')}
              </p>
            ) : (
              pageEntries.map((entry) => {
                const arabic = arabicFor(entry) ?? null;
                return (
                  <HadithCard
                    key={entry.hadithnumber}
                    arabic={arabic}
                    translation={hasTranslation ? entry : null}
                    bookName={localizedBookName}
                    sectionName={sectionTitleFor(entry)}
                  />
                );
              })
            )}
          </div>

          {/* Bottom pagination */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            tCommon={tCommon}
          />

          {/* Source attribution */}
          <p className="mt-4 px-1 text-center text-[11px] text-muted-foreground">
            {t('source_attribution')}
          </p>
        </>
      )}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  tCommon,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  // tCommon kept in signature for future use; pagination uses icons +
  // Hadith-namespace labels which are more specific.
  void tCommon;
  return (
    <div className="my-4 flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={onPrev}
        disabled={page === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
        {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={onNext}
        disabled={page >= totalPages - 1}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-10 text-center">
      <TriangleAlert className="mb-2 size-6 text-destructive" />
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}
