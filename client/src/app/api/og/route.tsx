/* eslint-disable react/no-unknown-property */
import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

import { OG_SIZE, renderOgCard } from '@/lib/og-template';
import { routing, type AppLocale } from '@/i18n/routing';

import enMessages from '../../../../messages/en.json';
import bnMessages from '../../../../messages/bn.json';
import arMessages from '../../../../messages/ar.json';

/**
 * Dynamic Open Graph endpoint.
 *
 *   GET /api/og?title=...&description=...&eyebrow=...&kind=...&locale=...&arabic=...
 *
 * Renders a 1200×630 PNG using the shared `renderOgCard` template so every
 * shared link gets a beautifully on-brand cover. Edge-rendered & cached.
 *
 * All params are optional — sensible defaults are pulled from the locale's
 * `messages/{locale}.json` so a bare hit to `/api/og` still produces a
 * branded card.
 *
 * Query params
 *   title       Headline. Defaults to "{brand} — {tagline}".
 *   description Body copy under the title. Defaults to landing subtitle.
 *   eyebrow     Small uppercase label above the title. Default depends on `kind`.
 *   kind        site | about | faq | feature — picks the eyebrow fallback.
 *   locale      en | bn | ar. Defaults to the routing default locale.
 *   arabic      Optional Arabic accent line in the footer. Defaults to bismillah.
 */

export const runtime = 'edge';
export const contentType = 'image/png';

type Messages = typeof enMessages;

const MESSAGES_BY_LOCALE: Record<AppLocale, Messages> = {
  en: enMessages,
  bn: bnMessages as unknown as Messages,
  ar: arMessages as unknown as Messages,
};

const KIND_TO_EYEBROW_KEY = {
  site: 'Landing.heroEyebrow',
  about: 'About.eyebrow',
  faq: 'FAQPage.eyebrow',
  feature: 'Landing.features_eyebrow',
} as const;

type Kind = keyof typeof KIND_TO_EYEBROW_KEY;

function resolveLocale(input: string | null): AppLocale {
  if (!input) return routing.defaultLocale;
  return (routing.locales as readonly string[]).includes(input)
    ? (input as AppLocale)
    : routing.defaultLocale;
}

function resolveKind(input: string | null): Kind {
  if (input && input in KIND_TO_EYEBROW_KEY) return input as Kind;
  return 'site';
}

/**
 * Walk a dotted path inside a messages tree and return the string value, or
 * undefined if the path doesn't resolve to a string.
 */
function readMessage(messages: Messages, dottedPath: string): string | undefined {
  const parts = dottedPath.split('.');
  let cursor: unknown = messages;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

/**
 * Hard cap user-supplied strings so a malicious / accidentally giant query
 * string can't blow up the layout (Satori will happily render 10k chars).
 */
function clamp(value: string | null | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const locale = resolveLocale(searchParams.get('locale'));
  const messages = MESSAGES_BY_LOCALE[locale];
  const kind = resolveKind(searchParams.get('kind'));

  const brand = readMessage(messages, 'Brand.name') ?? 'Ibadah';
  const tagline = readMessage(messages, 'Brand.tagline') ?? 'Journey Towards Allah';

  const title =
    clamp(searchParams.get('title'), 140) ?? `${brand} — ${tagline}`;

  const description =
    clamp(searchParams.get('description'), 220) ??
    readMessage(messages, 'Landing.heroSubtitle') ??
    '';

  const eyebrow =
    clamp(searchParams.get('eyebrow'), 60) ??
    readMessage(messages, KIND_TO_EYEBROW_KEY[kind]) ??
    '';

  const arabic =
    clamp(searchParams.get('arabic'), 80) ??
    readMessage(messages, 'Brand.bismillah_ar') ??
    undefined;

  return new ImageResponse(
    renderOgCard({
      brand,
      tagline,
      title,
      eyebrow,
      description,
      arabic,
    }),
    {
      ...OG_SIZE,
      headers: {
        // Cached aggressively at the edge. Pages can bust the cache by
        // varying any query param.
        'Cache-Control':
          'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
