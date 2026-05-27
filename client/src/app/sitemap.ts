import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

/**
 * Public sitemap. Includes the landing root and all public marketing
 * pages, plus the auth entry points, in every supported locale.
 *
 * The dashboard / app pages are intentionally excluded — they're behind
 * auth and don't add SEO value.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const lastModified = new Date();

  // [path, priority, changeFrequency]
  const paths: Array<[
    string,
    number,
    'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  ]> = [
    ['', 1.0, 'weekly'],
    ['/about', 0.8, 'monthly'],
    ['/faq', 0.7, 'monthly'],
    ['/login', 0.5, 'monthly'],
    ['/register', 0.6, 'monthly'],
  ];

  return routing.locales.flatMap((locale) =>
    paths.map(([path, priority, changeFrequency]) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency,
      priority,
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${base}/${l}${path}`]),
        ),
      },
    })),
  );
}
