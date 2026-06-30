'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchHadithEdition,
  type HadithBookSlug,
  type HadithEdition,
  type HadithEditionLang,
  type HadithEntry,
  localeToHadithLang,
} from '@/lib/hadith/hadith-api';

/**
 * One day in ms — used as TanStack Query staleTime/gcTime. The hadith
 * CDN is pinned to an immutable git tag, so the data does not change
 * during a session and refetching is wasteful.
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Fetch a single edition (book × language) and cache it for a day. */
export function useHadithEdition(
  book: HadithBookSlug,
  lang: HadithEditionLang,
  enabled = true,
) {
  return useQuery<HadithEdition>({
    queryKey: ['hadith', 'edition', book, lang],
    queryFn: ({ signal }) => fetchHadithEdition(book, lang, signal),
    enabled,
    staleTime: ONE_DAY_MS,
    gcTime: ONE_DAY_MS,
    retry: 1,
  });
}

/**
 * Bilingual book loader. For en/bn locales it loads the Arabic edition
 * AND the locale's translation in parallel. For ar locale it loads
 * only the Arabic edition.
 *
 * The "primary" edition is what the UI iterates over for pagination
 * and section navigation: in non-Arabic locales we want the translation
 * edition's localized section titles to drive navigation, so primary =
 * translation. The Arabic side is then joined in by `hadithnumber`.
 */
export interface BilingualBookResult {
  loading: boolean;
  error: Error | null;
  /** Primary edition the UI iterates over for navigation/pagination. */
  primary: HadithEdition | null;
  /** Arabic side of the same book (always loaded; equal to `primary` for ar). */
  arabic: HadithEdition | null;
  /** True when a separate translation edition is in play (en/bn). */
  hasTranslation: boolean;
  /** Helper to find the Arabic hadith for a given primary entry. */
  arabicFor: (entry: HadithEntry) => HadithEntry | null;
}

export function useHadithBookBilingual(
  book: HadithBookSlug,
  locale: string,
): BilingualBookResult {
  const { translation } = localeToHadithLang(locale);

  const arabicQuery = useHadithEdition(book, 'ara', true);
  // Always call the hook (Rules of Hooks) — disable when no
  // translation edition is needed for the active locale.
  const translationQuery = useHadithEdition(
    book,
    translation ?? 'eng',
    translation !== null,
  );

  const arabicData = arabicQuery.data ?? null;
  const translationData = translation !== null ? (translationQuery.data ?? null) : null;

  // Index Arabic by hadithnumber once per data change so the per-entry
  // lookup the page does is O(1).
  const arabicByNumber = React.useMemo(() => {
    if (!arabicData) return null;
    return new Map(arabicData.hadiths.map((h) => [h.hadithnumber, h]));
  }, [arabicData]);

  const primary = translation === null ? arabicData : translationData;

  const loading =
    arabicQuery.isLoading || (translation !== null && translationQuery.isLoading);
  const error =
    (arabicQuery.error as Error | null) ??
    (translation !== null ? ((translationQuery.error as Error | null) ?? null) : null);

  const arabicFor = React.useCallback(
    (entry: HadithEntry): HadithEntry | null => {
      if (translation === null) return entry; // already Arabic
      return arabicByNumber?.get(entry.hadithnumber) ?? null;
    },
    [translation, arabicByNumber],
  );

  return {
    loading,
    error,
    primary,
    arabic: arabicData,
    hasTranslation: translation !== null,
    arabicFor,
  };
}
