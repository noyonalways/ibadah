## Context

Ibadah's server is Express 5 + MongoDB (Mongoose), and the client is Next.js 15 with `next-intl`, Tailwind CSS, shadcn/ui, and React Query. The project already uses **conventional commits** (`feat:`, `fix:`, `refactor:`, `chore:`, etc.) and is hosted on **GitHub** (noyonalways/ibadah). Deployment uses **nixpacks** (Railway-style). There are currently **no git tags**.

The goal is a fully automated pipeline: **git tag → build → seed DB → API → client page**. After tagging a release and deploying, the changelog page updates itself with zero manual work.

Industry references: GitHub Releases, Linear Changelog, Notion What's New, Vercel Changelog.

## Goals / Non-Goals

**Goals:**
- Provide an industry-standard changelog page at `/releases`
- **Fully automate** release note generation from git history (conventional commits + tags)
- Store releases in MongoDB and serve via a public API
- Auto-seed new releases into the database on server startup after deployment
- Follow the existing marketing shell pattern (MarketingNav + Footer + Backdrop)
- Make the developer workflow: `git tag v1.x.0` → `git push --tags` → deploy → done

**Non-Goals:**
- No manual release editing UI in admin panel (future enhancement)
- No RSS/Atom feed (can be added later)
- No per-release detail pages (single scrollable timeline is sufficient)
- No translating individual release entries — only page chrome gets i18n
- No GitHub webhooks or CI-triggered generation — the script runs at build/startup time
- No retroactive parsing of the entire git history on first deploy (seed a few manual entries for pre-tag history)

## Decisions

### 1. Conventional commits as the source of truth

**Decision:** Parse git commit messages between tags to auto-categorize changes.

**Mapping:**
| Commit prefix | Category | Badge color |
|---|---|---|
| `feat:` | Feature | primary/emerald |
| `fix:` | Fix | destructive/red |
| `refactor:`, `perf:`, `style:`, `chore:`, `docs:`, `build:`, `ci:` | Enhancement | accent/gold |

**Rationale:** The project already uses conventional commits consistently. This is the same approach used by tools like `standard-version`, `semantic-release`, and `changesets`. Zero behavior change for the developer — they keep committing the way they already do.

**Alternative considered:** GitHub Releases API — rejected because it adds an external dependency, requires a token, and the data is already in the git history.

### 2. Git tags as version markers

**Decision:** Each release is defined by a git tag following semver: `v1.0.0`, `v1.1.0`, etc. The changelog script reads all `v*` tags and collects commits between consecutive tags.

**Workflow:**
```bash
# When ready to release:
git tag v1.1.0
git push origin main --tags
# Deploy as usual — the rest is automatic
```

**Rationale:** Git tags are the industry standard for marking releases. They're free, built into git, and every CI/CD system understands them.

### 3. Server-stored releases in MongoDB

**Decision:** Create a `Release` Mongoose model. Releases are stored in the database, not hardcoded in the client.

**Schema:**
```typescript
{
  version: string;          // "1.1.0" (tag without 'v' prefix)
  date: Date;               // tag creation date
  entries: [{
    category: 'feature' | 'fix' | 'enhancement';
    title: string;          // cleaned commit message (scope stripped)
    scope?: string;         // e.g. "ui", "api", "auth"
  }];
}
```

**Rationale:** Server-stored data means the client fetches dynamically — no client rebuild needed when release data changes. MongoDB is already the project's database. The Release collection is small and read-heavy, perfect for Mongo.

**Alternative considered:** Static TS data file on the client — rejected because it requires a client rebuild to update and can't be automated without a build step that modifies source code.

### 4. Auto-seed on server startup

**Decision:** The changelog generation script runs as part of the server build process. On server startup, a migration function checks for new versions not yet in the DB and inserts them.

**Flow:**
1. `pnpm build` in server triggers `generateChangelog.ts` → outputs `dist/changelog.json`
2. On server startup, `seedReleases()` reads `changelog.json`, compares versions against DB, and upserts any missing ones
3. Idempotent — running it multiple times is safe

**Rationale:** This ensures releases are always up-to-date without manual intervention. The startup migration pattern is already used in the project (seed:admin script). Build-time generation means git history is available (the `.git` directory exists during build).

### 5. Public API endpoint

**Decision:** `GET /api/v1/releases` — public (no auth), paginated, sorted by date descending.

**Query params:** `page` (default 1), `limit` (default 20)

**Rationale:** Public because the changelog is a marketing page — no user data involved. Pagination future-proofs for large histories. Follows the existing API envelope pattern (`{ success, message, data, meta }`).

### 6. Client data fetching

**Decision:** Use React Query (`useQuery`) with the existing `api()` helper to fetch from the releases endpoint. The page is a server component that pre-fetches on the server for SEO, with client-side hydration.

**Rationale:** Consistent with how other data-fetching pages work in the app. Server pre-fetch ensures the content is in the initial HTML for search engines.

### 7. Industry-standard timeline layout

**Decision:** Each version is a card/section with:
- Version badge (e.g., `v1.2.0`) with gradient styling
- Formatted date
- Grouped entries by category (Features first, then Enhancements, then Fixes)
- Category badge + entry title per item
- Vertical timeline connector between versions
- Reveal animations consistent with other marketing pages

**Rationale:** This mirrors Linear, Notion, and Vercel changelog layouts — the industry standard for SaaS changelog pages.

## Risks / Trade-offs

- **Git history must be available at build time** → Mitigation: nixpacks/Railway clones the full repo by default. If shallow clone is used, the script gracefully falls back to an empty changelog and logs a warning.
- **No git tags yet** → Mitigation: Seed the database with 2-3 manual "historical" entries for pre-tag releases, then start tagging from the next version onward.
- **Commit messages may have typos/bad formatting** → Mitigation: The script cleans up messages (strips scope prefix for display, capitalizes first letter). The entries are still more accurate than manual notes.
- **Build step adds complexity** → Mitigation: It's a single script call added to the build command. Fails gracefully (no git = empty changelog, not a build failure).
- **MongoDB read on every page load** → Mitigation: The Release collection is tiny. Can add in-memory caching or CDN cache headers later if needed.
