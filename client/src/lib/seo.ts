import type { Metadata } from 'next';

import { routing } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import type { AppLocale } from '@/i18n/routing';

/** Canonical site origin — set `NEXT_PUBLIC_SITE_URL` in production. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/** App segments that must never be indexed (locale prefix is added in robots.txt). */
export const PRIVATE_ROUTE_SEGMENTS = [
  'dashboard',
  'salah',
  'quran',
  'hadith',
  'dhikr',
  'habits',
  'checklist',
  'settings',
  'assistant',
  'auth',
] as const;

/** Disallow patterns for robots.txt — covers /en/dashboard, /ar/salah, etc. */
export function privateRobotsDisallow(): string[] {
  const routes = PRIVATE_ROUTE_SEGMENTS.flatMap((segment) => [
    `/*/${segment}`,
    `/*/${segment}/*`,
  ]);
  return [...routes, '/api', '/api/*'];
}

export const INDEXABLE_ROBOTS: NonNullable<Metadata['robots']> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
};

export const NOINDEX_ROBOTS: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

/** Normalize a path segment (`''`, `/about`, `about` → `''` or `/about`). */
export function normalizePublicPath(path: string): string {
  if (!path || path === '/') return '';
  return path.startsWith('/') ? path : `/${path}`;
}

/** hreflang + canonical for a public page in every supported locale. */
export function buildLocaleAlternates(locale: string, path: string) {
  const segment = normalizePublicPath(path);
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}${segment}`]),
  );
  languages['x-default'] = `/${routing.defaultLocale}${segment}`;

  return {
    canonical: `/${locale}${segment}`,
    languages,
  };
}

type PublicPageMetadataInput = {
  locale: string;
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  keywords?: string[];
};

/** Shared metadata shape for indexable marketing pages. */
export function buildPublicPageMetadata({
  locale,
  path,
  title,
  description,
  ogImage,
  keywords,
}: PublicPageMetadataInput): Metadata {
  const segment = normalizePublicPath(path);
  const image =
    ogImage ??
    ogImageUrl({
      locale: locale as AppLocale,
      kind: 'site',
      title,
      description,
    });

  return {
    title,
    description,
    keywords,
    alternates: buildLocaleAlternates(locale, segment),
    openGraph: {
      title,
      description,
      url: `/${locale}${segment}`,
      type: 'website',
      locale,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: INDEXABLE_ROBOTS,
  };
}

/** BreadcrumbList JSON-LD for public subpages. */
export function buildBreadcrumbJsonLd(
  locale: string,
  items: Array<{ name: string; path: string }>,
) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}/${locale}${normalizePublicPath(item.path)}`,
    })),
  };
}
