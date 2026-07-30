## Why

Users visiting the application currently lack a single dedicated showcase to discover, explore, and understand the application's AI capabilities, Islamic knowledge retrieval engine, and safety guardrails. Adding a dedicated AI showcase page (`/ai`) will highlight AI-powered features, demonstrate how the underlying AI engine works with authentic Islamic sources, and increase user engagement and trust.

## What Changes

- Add a dedicated showcase page under `client/src/app/[locale]/ai/page.tsx` displaying AI features, interactive feature previews, architecture ("How It Works"), and source authenticity principles.
- Add landing page navigation link and footer link under client landing page components to make the `/ai` page accessible.
- Add internationalization (i18n) translation keys for the AI showcase page across supported locales in `messages/*.json`.

## Capabilities

### New Capabilities
- `ai-showcase-page`: Dedicated showcase page and navigation for AI features, functionality breakdown, live feature demos, and architecture explanation.

### Modified Capabilities

## Impact

- **Client Routes**: `[locale]/ai` (new page route).
- **Components**: Header / Navigation bar and Footer updated with link to AI Showcase page.
- **Localization**: Added translation strings in `messages/en.json` (and other locale message files).
