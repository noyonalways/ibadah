/**
 * Hadith data source — fawazahmed0's static Hadith CDN, served via
 * jsDelivr from the immutable @1 git tag.
 *
 *   https://github.com/fawazahmed0/hadith-api
 *   https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{lang}-{book}.min.json
 *
 * Why this source:
 *  - Zero-auth, zero-cost public CDN (no rate limiting we need to manage).
 *  - Immutable, content-addressed via the `@1` tag — safe to cache long.
 *  - Covers all six canonical Sunni books (Kutub as-Sittah) in Arabic,
 *    English, AND Bengali — matching every locale this app supports.
 *
 * Authenticity scope: this module deliberately exposes ONLY the six
 * authentic books (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn
 * Majah). Other collections in the upstream dataset (Ahmad, Malik,
 * Darimi, etc.) are intentionally omitted from the picker because their
 * authenticity gradings are mixed and graded reliability is not
 * uniformly available in the source data.
 *
 * NOTE: this client uses raw fetch — NOT the internal `api()` helper
 * from `lib/api.ts`. The hadith CDN is a plain JSON file: no auth, no
 * envelope, no error shape to unwrap.
 */

export const HADITH_CDN_BASE =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

/** Slug used in the upstream URL (`{lang}-{book}.min.json`). */
export type HadithBookSlug =
  | 'bukhari'
  | 'muslim'
  | 'abudawud'
  | 'tirmidhi'
  | 'nasai'
  | 'ibnmajah';

/** Three-letter language prefix used in the upstream URL. */
export type HadithEditionLang = 'ara' | 'eng' | 'ben';

/**
 * Editorial metadata for the books we surface. Order is the standard
 * authenticity-of-collection ordering used by Sunni scholars (Bukhari →
 * Muslim → the four Sunan, with Nasa'i traditionally listed third).
 *
 * `author` and `compiledHijri` are static reference data: they're shown
 * in the book picker so users can verify they're reading from the
 * canonical compilations.
 */
export interface HadithBookMeta {
  slug: HadithBookSlug;
  /** Title key in the `Hadith.books` translation namespace. */
  titleKey: string;
  /** Compiler / muḥaddith. */
  author: string;
  /** Approximate count of narrations in this collection. Display only. */
  count: number;
  /** Hijri century the collection was compiled in. Display only. */
  compiledHijri: string;
}

/**
 * The six canonical Sunni hadith collections (الكتب الستة).
 *
 * Counts and dates are conventionally cited figures and serve only as
 * descriptive metadata in the UI; the source of truth for the actual
 * narration text is the runtime fetch from the CDN.
 */
export const KUTUB_AS_SITTAH: readonly HadithBookMeta[] = [
  {
    slug: 'bukhari',
    titleKey: 'bukhari',
    author: 'Imam al-Bukhari',
    count: 7563,
    compiledHijri: '3rd c. AH',
  },
  {
    slug: 'muslim',
    titleKey: 'muslim',
    author: 'Imam Muslim',
    count: 7563,
    compiledHijri: '3rd c. AH',
  },
  {
    slug: 'nasai',
    titleKey: 'nasai',
    author: "Imam an-Nasa'i",
    count: 5761,
    compiledHijri: '3rd c. AH',
  },
  {
    slug: 'abudawud',
    titleKey: 'abudawud',
    author: 'Imam Abu Dawud',
    count: 5274,
    compiledHijri: '3rd c. AH',
  },
  {
    slug: 'tirmidhi',
    titleKey: 'tirmidhi',
    author: 'Imam at-Tirmidhi',
    count: 3956,
    compiledHijri: '3rd c. AH',
  },
  {
    slug: 'ibnmajah',
    titleKey: 'ibnmajah',
    author: 'Imam Ibn Majah',
    count: 4341,
    compiledHijri: '3rd c. AH',
  },
] as const;

/**
 * Map an app locale (next-intl) to the upstream language prefix.
 * Arabic returns `null` because there's only one Arabic edition and we
 * present Arabic on its own (no second translation needed for ar users).
 */
export function localeToHadithLang(
  locale: string,
): { translation: HadithEditionLang | null } {
  if (locale === 'bn') return { translation: 'ben' };
  if (locale === 'ar') return { translation: null };
  return { translation: 'eng' };
}

// ── Wire-format types (mirrors the upstream JSON shape) ──────────────────────

export interface HadithGrade {
  /** Grader name, e.g. "Darussalam", "Al-Albani". May be omitted upstream. */
  name?: string;
  /** Grade text, e.g. "Sahih", "Hasan", "Daif". */
  grade: string;
}

export interface HadithReference {
  /** Section / chapter number within the book. */
  book: number;
  /** Hadith number within the section. */
  hadith: number;
}

export interface HadithEntry {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  grades: HadithGrade[];
  reference: HadithReference;
}

export interface HadithSectionDetail {
  hadithnumber_first: number;
  hadithnumber_last: number;
  arabicnumber_first: number;
  arabicnumber_last: number;
}

export interface HadithMetadata {
  name: string;
  /** Section index (string-keyed) -> section title. Index "0" is unused. */
  sections: Record<string, string>;
  section_details: Record<string, HadithSectionDetail>;
}

export interface HadithEdition {
  metadata: HadithMetadata;
  hadiths: HadithEntry[];
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Fetch one edition (book × language) directly from the jsDelivr CDN.
 *
 * The CDN sets aggressive HTTP cache headers and serves Brotli/gzip;
 * we additionally rely on TanStack Query's in-memory cache layered on
 * top (see `useHadithBookBilingual`). Because the upstream URL is
 * pinned to the @1 git tag, the contents are immutable — we can safely
 * use a 24h staleTime and `force-cache`.
 */
export async function fetchHadithEdition(
  book: HadithBookSlug,
  lang: HadithEditionLang,
  signal?: AbortSignal,
): Promise<HadithEdition> {
  const url = `${HADITH_CDN_BASE}/${lang}-${book}.min.json`;
  const res = await fetch(url, {
    signal,
    cache: 'force-cache',
    // No credentials — this is a public CDN.
  });
  if (!res.ok) {
    throw new Error(`Failed to load hadith edition ${lang}-${book} (HTTP ${res.status})`);
  }
  return (await res.json()) as HadithEdition;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Stable, sorted list of section keys for a given edition. */
export function listSections(meta: HadithMetadata): Array<{
  key: string;
  index: number;
  title: string;
  detail: HadithSectionDetail;
}> {
  return Object.keys(meta.sections)
    .map((k) => ({
      key: k,
      index: Number(k),
      title: meta.sections[k] ?? '',
      detail: meta.section_details[k],
    }))
    .filter((s) => s.detail !== undefined && s.detail.hadithnumber_last > 0)
    .sort((a, b) => a.index - b.index);
}

/**
 * Slice an edition down to a single section's narrations.
 * Returns the matching `HadithEntry`s in their natural ordering.
 */
export function hadithsInSection(
  edition: HadithEdition,
  sectionDetail: HadithSectionDetail,
): HadithEntry[] {
  const { hadithnumber_first: lo, hadithnumber_last: hi } = sectionDetail;
  return edition.hadiths.filter(
    (h) => h.hadithnumber >= lo && h.hadithnumber <= hi,
  );
}

/**
 * Pair a translation entry with its Arabic counterpart by `hadithnumber`.
 * Returns `null` for the Arabic side if no exact match exists (rare,
 * but defensible if the upstream files diverge).
 */
export function buildArabicIndex(
  arabic: HadithEdition,
): Map<number, HadithEntry> {
  return new Map(arabic.hadiths.map((h) => [h.hadithnumber, h]));
}

/**
 * Deterministically pick a single hadith for "of the day" by hashing
 * the day key against the available count. Same date + book = same
 * hadith for everyone, so the share value of the card is stable.
 */
export function pickHadithOfTheDay(
  edition: HadithEdition,
  dayKey: string, // YYYY-MM-DD
): HadithEntry | null {
  if (edition.hadiths.length === 0) return null;
  // Simple djb2 hash — plenty of mixing for this use case.
  let h = 5381;
  for (let i = 0; i < dayKey.length; i++) {
    h = ((h << 5) + h + dayKey.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % edition.hadiths.length;
  return edition.hadiths[idx];
}
