## ADDED Requirements

### Requirement: Releases page displays versioned changelog
The system SHALL render a public `/releases` page that displays a chronological timeline of application releases, ordered from newest to oldest. Each release entry SHALL display a version tag, a human-readable date, and one or more categorized change items.

#### Scenario: User visits the releases page
- **WHEN** a user navigates to `/releases`
- **THEN** the page SHALL display a list of all releases fetched from the API, ordered by date descending (newest first)
- **AND** each release SHALL show its version number (e.g., "v1.2.0") and formatted date

#### Scenario: Release with multiple change items
- **WHEN** a release contains multiple change items
- **THEN** items SHALL be grouped by category (Features first, then Enhancements, then Fixes)
- **AND** each item SHALL display its category badge, title, and optional scope tag

### Requirement: Change items have category badges
The system SHALL categorize each change item as one of: `feature`, `fix`, or `enhancement`. Each category SHALL be visually distinguished with a color-coded badge.

#### Scenario: Feature category display
- **WHEN** a change item has category `feature`
- **THEN** it SHALL display a badge with the label "Feature" (or its i18n equivalent) using the primary/emerald color scheme

#### Scenario: Fix category display
- **WHEN** a change item has category `fix`
- **THEN** it SHALL display a badge with the label "Fix" (or its i18n equivalent) using the destructive/red color scheme

#### Scenario: Enhancement category display
- **WHEN** a change item has category `enhancement`
- **THEN** it SHALL display a badge with the label "Enhancement" (or its i18n equivalent) using the accent/gold color scheme

### Requirement: Release data served via public API
The system SHALL expose a public API endpoint `GET /api/v1/releases` that returns release data from MongoDB. The endpoint SHALL NOT require authentication.

#### Scenario: Fetching releases
- **WHEN** a client sends `GET /api/v1/releases`
- **THEN** the server SHALL respond with releases sorted by date descending
- **AND** the response SHALL follow the standard API envelope: `{ success, message, data, meta }`

#### Scenario: Paginated results
- **WHEN** a client sends `GET /api/v1/releases?page=2&limit=10`
- **THEN** the server SHALL return the second page of results with at most 10 entries
- **AND** `meta` SHALL include `page`, `limit`, `total`, and `totalPages`

#### Scenario: Empty collection
- **WHEN** the releases collection has no entries
- **THEN** the server SHALL return `{ success: true, data: [], meta: { total: 0 } }`

### Requirement: Release MongoDB model
The system SHALL store releases in a `Release` Mongoose model with the following schema:
- `version` (String, unique, required) — semver version without `v` prefix (e.g., "1.2.0")
- `date` (Date, required) — the tag creation date
- `entries` (Array of objects, required) — each with:
  - `category` (String enum: `feature`, `fix`, `enhancement`, required)
  - `title` (String, required) — cleaned commit subject line
  - `scope` (String, optional) — commit scope (e.g., "ui", "api")

#### Scenario: Unique version constraint
- **WHEN** the system attempts to insert a release with a version that already exists
- **THEN** the operation SHALL upsert (update the existing record) rather than create a duplicate

### Requirement: Automated changelog generation from conventional commits
The system SHALL include a build-time script that parses git history to generate release data. The script SHALL read all `v*` git tags, collect commits between consecutive tags, and map conventional commit prefixes to categories.

#### Scenario: Parsing feat commits
- **WHEN** a commit message starts with `feat:` or `feat(scope):`
- **THEN** the script SHALL categorize it as `feature`
- **AND** extract the scope (if present) and the subject line

#### Scenario: Parsing fix commits
- **WHEN** a commit message starts with `fix:` or `fix(scope):`
- **THEN** the script SHALL categorize it as `fix`

#### Scenario: Parsing other conventional commits
- **WHEN** a commit message starts with `refactor:`, `perf:`, `style:`, `chore:`, `docs:`, `build:`, or `ci:`
- **THEN** the script SHALL categorize it as `enhancement`

#### Scenario: Non-conventional commits
- **WHEN** a commit message does not match any conventional commit prefix
- **THEN** the script SHALL categorize it as `enhancement` with the full message as the title

#### Scenario: No git tags found
- **WHEN** the script runs but finds no `v*` git tags
- **THEN** the script SHALL output an empty changelog array and log a warning
- **AND** the build SHALL NOT fail

#### Scenario: Git not available
- **WHEN** the script runs in an environment without git or without a `.git` directory
- **THEN** the script SHALL output an empty changelog array and log a warning
- **AND** the build SHALL NOT fail

### Requirement: Auto-seed releases on server startup
The system SHALL run a migration function on server startup that reads the generated changelog data and upserts any new releases into MongoDB. The migration SHALL be idempotent.

#### Scenario: New version available
- **WHEN** the server starts and the changelog contains a version not yet in the database
- **THEN** the migration SHALL insert the new release into the database

#### Scenario: Existing version unchanged
- **WHEN** the server starts and all changelog versions already exist in the database
- **THEN** the migration SHALL skip insertion and log that releases are up-to-date

#### Scenario: Re-deployment with same version
- **WHEN** the server restarts with the same changelog data
- **THEN** the migration SHALL be idempotent — no duplicates SHALL be created

### Requirement: Releases page uses marketing shell
The system SHALL render the releases page within the existing marketing shell layout, including MarketingNav, MarketingBackdrop, and Footer components.

#### Scenario: Page layout consistency
- **WHEN** a user views the releases page
- **THEN** the page SHALL display the marketing navigation bar at the top
- **AND** the marketing backdrop behind the content
- **AND** the footer at the bottom
- **AND** the layout SHALL be consistent with other marketing pages (features, about, faq)

### Requirement: Releases page has proper SEO metadata
The system SHALL generate appropriate SEO metadata for the releases page, including title tag, meta description, Open Graph image, and breadcrumb JSON-LD structured data.

#### Scenario: Search engine indexing
- **WHEN** a search engine crawler visits `/releases`
- **THEN** the page SHALL have a descriptive `<title>` tag
- **AND** a `<meta name="description">` tag
- **AND** Open Graph meta tags with an OG image
- **AND** breadcrumb JSON-LD structured data

### Requirement: Releases page supports i18n for page chrome
The system SHALL translate the page title, subtitle, eyebrow text, and category badge labels using the `next-intl` translation system. Individual release entry content (titles and scopes) SHALL remain in their authored language.

#### Scenario: Page chrome in Bengali
- **WHEN** a user views the releases page with locale set to `bn`
- **THEN** the page title, subtitle, eyebrow, and badge labels SHALL display in Bengali
- **AND** release entry titles SHALL remain in their original language (English)

### Requirement: Releases link in navigation
The system SHALL include a link to the releases page in the site footer's "Resources" column and in the marketing navigation bar (both desktop and mobile views).

#### Scenario: Footer link
- **WHEN** a user views any marketing page's footer
- **THEN** the "Resources" column SHALL include a "Releases" link pointing to `/releases`

#### Scenario: Navigation link
- **WHEN** a user views the marketing navigation bar
- **THEN** the nav SHALL include a "Releases" link pointing to `/releases`

### Requirement: Empty state handling
The system SHALL display a meaningful empty state if no releases are available from the API.

#### Scenario: No releases available
- **WHEN** the API returns zero releases
- **THEN** the page SHALL display a friendly empty-state message indicating no releases are available yet

### Requirement: Releases page included in sitemap
The system SHALL include the `/releases` route in the application's sitemap.

#### Scenario: Sitemap generation
- **WHEN** the sitemap is generated
- **THEN** it SHALL include an entry for `/releases` with the correct locale alternates
