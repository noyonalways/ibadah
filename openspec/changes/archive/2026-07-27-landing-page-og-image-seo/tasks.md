## 1. Root Layout & Metadata Helpers

- [x] 1.1 Update `client/src/app/[locale]/layout.tsx` to set explicit fallback `openGraph.images` and `twitter.images` using `ogImageUrl({ locale, kind: 'site' })`
- [x] 1.2 Audit `client/src/lib/seo.ts` to ensure `buildPublicPageMetadata` produces fully compliant OpenGraph and Twitter image meta structures across all locales

## 2. Public Landing & Marketing Pages Integration

- [x] 2.1 Verify `client/src/app/[locale]/page.tsx` exports `generateMetadata` with landing specific `ogImageUrl` parameters
- [x] 2.2 Verify and refine metadata configuration across public subpages (`about`, `faq`, `features`, `privacy`, `terms`, `releases`)
- [x] 2.3 Verify `client/src/app/[locale]/opengraph-image.tsx` and `twitter-image.tsx` dynamic image generators

## 3. Verification & Build Validation

- [x] 3.1 Run client TypeScript check and build validation
- [x] 3.2 Inspect generated meta tags (`og:image`, `twitter:image`, `twitter:card`, canonical, JSON-LD) across landing and public marketing routes
