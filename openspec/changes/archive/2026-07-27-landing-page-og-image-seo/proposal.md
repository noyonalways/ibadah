## Why

When sharing the Ibadah web app links across social media platforms (Twitter/X, Facebook, WhatsApp, Telegram, LinkedIn, Discord), preview cards require properly configured OpenGraph (`og:image`) and Twitter (`twitter:image`) metadata tags pointing to dynamically generated high-resolution card images. While `/api/og` exists for dynamic OG image creation, root layouts and public landing pages need seamless integration with dynamic parameters, locale support, fallback default tags in root layouts, and refined search engine optimization (SEO) across all public pages.

## What Changes

- **Root Layout Social Metadata**: Configure default `openGraph.images` and `twitter.images` in `src/app/[locale]/layout.tsx` pointing to dynamic `/api/og` endpoint with locale context so any shared page has a rich preview fallback.
- **Landing & Public Page Dynamic OG Integration**: Ensure `page.tsx` for the main landing page, `about`, `faq`, `features`, `privacy`, `terms`, and `releases` pass locale-aware title, description, and eyebrow parameters to `ogImageUrl()` via `buildPublicPageMetadata()`.
- **Next.js Route OG Card Fallbacks**: Update `src/app/[locale]/opengraph-image.tsx` and `src/app/[locale]/twitter-image.tsx` to handle locale resolution and provide crisp 1200×630 cards matching app brand identity.
- **SEO & Social Share Optimization**: Audit and enrich SEO elements (canonical URLs, structured JSON-LD data, robots settings, meta titles/descriptions) across landing and public marketing routes.

## Capabilities

### New Capabilities

- `og-image-seo`: Dynamic OpenGraph image routing, social share cards, and SEO metadata integration across landing and public app pages.

### Modified Capabilities

<!-- None -->

## Impact

- `client/src/app/[locale]/layout.tsx`: Updated root metadata defaults for OpenGraph and Twitter images.
- `client/src/app/[locale]/page.tsx`: Explicit `generateMetadata` and `ogImageUrl` integration.
- `client/src/app/[locale]/opengraph-image.tsx` & `twitter-image.tsx`: Aligned dynamic fallback cards.
- `client/src/lib/seo.ts`: Refined `buildPublicPageMetadata` to ensure valid absolute or relative OG image URL handling across locales.
