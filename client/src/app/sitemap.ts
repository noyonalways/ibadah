import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { getSiteUrl, normalizePublicPath } from '@/lib/seo';

/**
 * Public sitemap — marketing and auth entry pages only.
 * Dashboard / app routes are excluded (private, behind auth).
 */
const PUBLIC_PATHS: Array<[
  string,
  number,
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
]> = [
  ['', 1.0, 'weekly'],
  ['/features', 0.9, 'monthly'],
  ['/releases', 0.8, 'weekly'],
  ['/about', 0.8, 'monthly'],
  ['/faq', 0.7, 'monthly'],
  ['/privacy', 0.5, 'yearly'],
  ['/terms', 0.5, 'yearly'],
  ['/register', 0.6, 'monthly'],
  ['/login', 0.4, 'monthly'],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map(([path, priority, changeFrequency]) => {
      const segment = normalizePublicPath(path);
      const languages = Object.fromEntries(
        routing.locales.map((l) => [l, `${base}/${l}${segment}`]),
      );
      languages['x-default'] = `${base}/${routing.defaultLocale}${segment}`;

      return {
        url: `${base}/${locale}${segment}`,
        changeFrequency,
        priority,
        lastModified,
        alternates: { languages },
      };
    }),
  );
}
