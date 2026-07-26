## Context

The Ibadah client application is built with Next.js App Router and `@next-intl` localization. It features an edge-rendered dynamic Open Graph endpoint at `/api/og` (`src/app/api/og/route.tsx`) that uses `@vercel/og` (Satori + Resvg) and `renderOgCard` to generate 1200×630 PNG images.

Currently, while dynamic OG images exist and helper functions (`ogImageUrl`, `buildPublicPageMetadata`) are implemented in `src/lib/seo.ts`, the root layout (`src/app/[locale]/layout.tsx`) lacks default `openGraph.images` and `twitter.images` fields. When sharing generic links or fallback routes on social media platforms, cards might fail to display images or fall back unpredictably.

## Goals / Non-Goals

**Goals:**
- Provide robust, locale-aware OpenGraph and Twitter card preview images for the landing page and all public marketing pages when shared on social media.
- Ensure root layout (`src/app/[locale]/layout.tsx`) sets explicit fallback `openGraph.images` and `twitter.images` pointing to `/api/og`.
- Ensure all public pages (`/`, `/about`, `/faq`, `/features`, `/privacy`, `/terms`, `/releases`) reliably output full metadata including `og:image`, `twitter:image`, `twitter:card: summary_large_image`, canonical tags, and structured JSON-LD.
- Validate dynamic OG card output for all supported locales (`en`, `bn`, `ar`).

**Non-Goals:**
- Generating personalized OG cards for private user-authenticated dashboard routes (e.g. `/dashboard/salah`).

## Decisions

### Decision 1: Root Layout Fallback OG Metadata
Update `generateMetadata` in `src/app/[locale]/layout.tsx` to include default `openGraph.images` and `twitter.images` using `ogImageUrl({ locale, kind: 'site' })`.

*Rationale*: Next.js merges child metadata into layout metadata. Having root fallback images guarantees that any route missing page-level OG image overrides will still render a polished brand social card.

### Decision 2: Page-Level Dynamic OG Image Specification
Utilize `buildPublicPageMetadata()` in every public marketing page's `generateMetadata()` function, passing route-specific `kind` (`site`, `about`, `faq`, `feature`), localized `title`, `description`, and `eyebrow`.

*Rationale*: Each public page gets a customized social share card matching its exact section title and summary instead of a generic site landing card.

### Decision 3: Image URL Resolution with metadataBase
Keep `ogImageUrl()` returning root-relative paths (`/api/og?...`) which automatically resolve to absolute URLs using `metadataBase` (`new URL(getSiteUrl())`) defined in `layout.tsx`.

*Rationale*: Preserves proper environment portability (`localhost:3000` in dev vs `NEXT_PUBLIC_SITE_URL` in production) without hardcoding absolute domain origins in code.

## Risks / Trade-offs

- **[Risk] Satori Arabic Glyph Unsupported Lookup**: Satori's Arabic shaper crashes on complex Arabic script.
  *Mitigation*: Pre-existing `stripArabic` and transliteration accent strategy in `/api/og/route.tsx` is preserved to prevent runtime edge crashes.
- **[Risk] Edge Caching Stale Cards**: Social platforms aggressively cache OG images.
  *Mitigation*: `/api/og` response header uses `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`, allowing query-param cache busting when metadata changes.
