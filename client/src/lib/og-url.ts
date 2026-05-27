import type { AppLocale } from '@/i18n/routing';

/**
 * Build a URL to the dynamic OG endpoint at `/api/og`.
 *
 * The result is intentionally a relative path — `metadataBase` (set in the
 * locale layout) turns it into an absolute URL when Next.js renders the
 * `<meta property="og:image">` tag, which is what crawlers expect.
 *
 * Pass only the params you want to override; the route falls back to
 * locale-aware defaults for everything else.
 */
export function ogImageUrl(
  params: {
    title?: string;
    description?: string;
    eyebrow?: string;
    kind?: 'site' | 'about' | 'faq' | 'feature';
    locale?: AppLocale;
    arabic?: string;
  } = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `/api/og?${qs}` : '/api/og';
}
