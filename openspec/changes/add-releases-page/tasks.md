## 1. Server — Release Model

- [x] 1.1 Create `server/src/modules/release/release.model.ts` — Mongoose schema with `version` (String, unique), `date` (Date), and `entries` array (each with `category` enum, `title`, optional `scope`). Add index on `date: -1`.
- [x] 1.2 Create `server/src/modules/release/release.interface.ts` — TypeScript interfaces for `IRelease`, `IReleaseEntry`, and query params.

## 2. Server — Changelog Generation Script

- [x] 2.1 Create `server/src/scripts/generateChangelog.ts` — reads all `v*` git tags via `child_process.execSync`, collects commits between consecutive tags using `git log`, parses conventional commit prefixes into categories (`feat:` → feature, `fix:` → fix, others → enhancement), extracts scope, cleans title. Outputs structured JSON to `dist/changelog.json`. Handles edge cases: no tags → empty array + warning, no git → empty array + warning, never fails the build.
- [x] 2.2 Add `generate:changelog` script to `server/package.json` and integrate into the `build` script so it runs automatically during `pnpm build`.

## 3. Server — Release Service & Seed Migration

- [x] 3.1 Create `server/src/modules/release/release.service.ts` — `getReleases(page, limit)` for paginated sorted query, and `seedReleases()` that reads `dist/changelog.json`, compares versions against DB, and upserts new entries. Idempotent.
- [x] 3.2 Wire `seedReleases()` into the server startup sequence (in `server/src/app.ts` or `server.ts`, after DB connection) so it runs automatically on every deployment.

## 4. Server — Release API Route

- [x] 4.1 Create `server/src/modules/release/release.controller.ts` — handler for `GET /` that calls the service and returns paginated data in the standard API envelope (`{ success, message, data, meta }`).
- [x] 4.2 Create `server/src/modules/release/release.route.ts` — Express router mounting the controller at `/`.
- [x] 4.3 Register the release route in the server's main route file at `/api/v1/releases` (public, no auth middleware).

## 5. Client — API Transport & Hook

- [x] 5.1 Create `client/src/lib/releases-api.ts` — `fetchReleases(page?, limit?)` function using the existing `api()` helper to call `GET /releases`.
- [x] 5.2 Create `client/src/hooks/use-releases.ts` — React Query `useQuery` hook wrapping `fetchReleases` with appropriate cache/stale config.

## 6. Client — i18n Messages

- [x] 6.1 Add `ReleasesPage` namespace keys to `client/messages/en.json` — include `metaTitle`, `metaDescription`, `eyebrow`, `title`, `lead`, `badgeFeature`, `badgeFix`, `badgeEnhancement`, `emptyTitle`, `emptyDescription`, `version`.
- [x] 6.2 Add matching `ReleasesPage` keys to `client/messages/bn.json` (Bengali translations).
- [x] 6.3 Add matching `ReleasesPage` keys to `client/messages/ar.json` (Arabic translations).
- [x] 6.4 Add `Nav.releases` (or equivalent) translation key to all three locale message files for navigation labels.

## 7. Client — Releases Page

- [x] 7.1 Create `client/src/app/[locale]/releases/page.tsx` — server component with `generateMetadata` (title, description, OG image, breadcrumb JSON-LD). Uses MarketingNav + MarketingBackdrop + Footer shell. Renders an industry-standard timeline layout: version badge, formatted date, entries grouped by category (Features → Enhancements → Fixes), category badges, vertical timeline connector between versions. Includes empty-state handling and Reveal animations. Fetches data from the releases API.

## 8. Client — Navigation Integration

- [x] 8.1 Add "Releases" link to the footer's "Resources" column in `client/src/components/landing/footer.tsx`.
- [x] 8.2 Add "Releases" link to the marketing nav (desktop links and mobile drawer) in `client/src/components/landing/marketing-nav.tsx`.

## 9. SEO & Sitemap

- [x] 9.1 Add `/releases` route entry to `client/src/app/sitemap.ts` with proper locale alternates.

## 10. Seed Data for Pre-Tag History

- [x] 10.1 Add 2-3 manual historical release entries (for versions before git tagging begins) directly in the `generateChangelog.ts` output or as a seed fallback, so the page has content from day one.

## 11. Verification

- [x] 11.1 Run `pnpm build` in the server to verify the changelog generation script runs and produces `dist/changelog.json`.
- [x] 11.2 Run `pnpm build` in the client to verify the page compiles without errors.
- [x] 11.3 Start the server locally and verify the seed migration runs on startup, inserting releases into MongoDB.
- [x] 11.4 Verify `GET /api/v1/releases` returns the expected paginated data with correct structure.
- [x] 11.5 Verify the page renders correctly at `http://localhost:3000/en/releases` — check timeline layout, badges, responsiveness, and navigation links.
