## Why

Ibadah is actively evolving — new features ship, bugs get squashed, and the experience steadily improves. Right now users have no way to discover what changed unless they stumble upon differences themselves. A dedicated **Releases** page (changelog / what's new) solves this by giving users a single, browsable timeline of every version's highlights.

This is absolutely practical for Ibadah:
- It builds **trust and transparency** — users see the app is alive and cared-for.
- It drives **re-engagement** — users discover freshly shipped features.
- The project already uses **conventional commits** (`feat:`, `fix:`, `refactor:`, etc.), which means release notes can be **auto-generated** from git history — zero manual writing needed.

The release data pipeline is fully automated: tag a version → deploy → release notes appear on the page automatically.

## What Changes

- **New server module** (`server/src/modules/release/`) — Mongoose model for releases, a public API endpoint (`GET /api/v1/releases`), and a service layer.
- **Changelog generation script** (`server/src/scripts/generateChangelog.ts`) — reads git tags and conventional commits between them, maps commit prefixes to categories (Feature / Fix / Enhancement), and outputs structured release data.
- **Auto-seed on deploy** — the server build script generates the changelog and a startup migration upserts new releases into MongoDB. After every deployment, the latest version's notes are live with zero manual work.
- **New `/releases` marketing page** on the client — fetches from the API and renders an industry-standard changelog timeline with version headers, dates, category badges, and grouped entries. Inspired by Linear, GitHub Releases, and Notion changelog patterns.
- **Navigation integration** — "Releases" link in the footer and marketing nav.
- **i18n support** — page chrome (title, badges, etc.) translated via `next-intl`. Individual release entries remain in English (technical changelogs are rarely translated).
- **SEO metadata** — title, meta description, OG image, breadcrumb JSON-LD.

## Capabilities

### New Capabilities
- `releases-page`: A public changelog page with an automated data pipeline — git tags and conventional commits are parsed into structured release entries, stored in MongoDB, served via a public API, and rendered as an industry-standard versioned timeline with category badges, version tags, and dates.

### Modified Capabilities
_(none — no existing specs need requirement changes)_

## Impact

- **Server:**
  - New module: `server/src/modules/release/` (model, service, controller, route)
  - New script: `server/src/scripts/generateChangelog.ts`
  - Server startup hook to run changelog migration
  - New public route: `GET /api/v1/releases`
- **Client:**
  - `client/src/app/[locale]/releases/page.tsx` (new page)
  - `client/src/lib/releases-api.ts` (new API transport)
  - `client/src/hooks/use-releases.ts` (new React Query hook)
  - `client/src/components/landing/footer.tsx` (add link)
  - `client/src/components/landing/marketing-nav.tsx` (add link)
  - `client/messages/en.json`, `bn.json`, `ar.json` (new i18n keys)
  - `client/src/app/sitemap.ts` (add `/releases` entry)
- **No new client dependencies** — uses existing components and `react-query`.
- **No breaking changes.**
