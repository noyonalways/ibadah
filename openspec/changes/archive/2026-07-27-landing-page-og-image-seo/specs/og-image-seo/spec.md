## ADDED Requirements

### Requirement: Dynamic OpenGraph Image Generation for Social Cards

The system SHALL generate high-resolution 1200x630 OpenGraph and Twitter card images using the dynamic `/api/og` endpoint supporting locale awareness, brand typography, and customizable query parameters (`title`, `description`, `eyebrow`, `kind`, `accent`, `locale`).

#### Scenario: Dynamic OG image request with query parameters
- **WHEN** a client or social media scraper sends an HTTP GET request to `/api/og` with specific query parameters or locale settings
- **THEN** the system SHALL return a edge-cached 1200x630 PNG image matching the specified layout template and localized text.

#### Scenario: Fallback OG card rendering
- **WHEN** a request to `/api/og` does not specify custom query parameters
- **THEN** the system SHALL resolve default brand values and hero titles from the requested locale's translation dictionary.

### Requirement: Public Page SEO and OpenGraph Metadata Integration

The system SHALL embed accurate, localized OpenGraph (`og:image`, `og:title`, `og:description`, `og:url`), Twitter card (`twitter:card`, `twitter:image`, `twitter:title`), canonical links, and JSON-LD structured data across all public landing and marketing pages (`/`, `/about`, `/faq`, `/features`, `/privacy`, `/terms`, `/releases`).

#### Scenario: Public landing page social share metadata inspection
- **WHEN** a link to any public landing or marketing route is shared on social media or parsed by search engine crawlers
- **THEN** the rendered HTML `<head>` SHALL include explicit `<meta property="og:image">` and `<meta name="twitter:image">` tags referencing the locale-aware dynamic OG image endpoint.

#### Scenario: Search engine indexing of marketing pages
- **WHEN** search engines index public marketing routes
- **THEN** each page SHALL present a valid canonical URL, hreflang alternate language links for supported locales, and valid schema.org structured data.
