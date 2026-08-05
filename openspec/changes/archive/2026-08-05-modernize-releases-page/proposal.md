## Why

The current releases page design (`/releases`) is plain, lacks visual excitement, and provides minimal context around releases. Users looking for product updates want a modern, high-grade changelog experience with version serial tracking, quick metrics, category filtering, search capabilities, and sleek visual timeline highlights. Modernizing this page will significantly improve brand perception and user engagement.

## What Changes

- **Version Serial & Metadata Enhancement**: Add prominent version serial numbers (e.g. Serial #01, #02... / Release #N sequence badges), release types (Major/Minor/Patch), tag badges, and commit counts.
- **Hero & Release Stats Header**: Add a interactive stats overview bar displaying Total Releases, Latest Version, Last Update Date, and quick category counters.
- **Category Filtering & Search**: Add real-time client-side search across release notes and category filter buttons (All, Features, Enhancements, Fixes).
- **Modern Animated Timeline UI**: Redesign the timeline with a glowing animated gradient spine, hero highlight for the latest release, glassmorphic cards, expandable release entries, and sleek hover effects.
- **Enhanced Change Badges**: Distinct visual treatments and icons for features, performance updates, bug fixes, and breaking changes.

## Capabilities

### New Capabilities
- `releases-ui`: Modernized releases page UI with serial numbering, release metrics header, search/filtering, and enhanced timeline visual design.

### Modified Capabilities

## Impact

- `client/src/app/[locale]/releases/page.tsx`: Updated page layout and header structure.
- `client/src/components/landing/releases-timeline.tsx`: Enhanced timeline component with serial badges, filters, search, and animations.
- `client/src/lib/releases-api.ts` & `client/src/hooks/use-releases.ts`: Minor helper extensions for serial index calculation if needed.
- `client/messages/*.json`: i18n string additions for filter labels, serial text, and metrics labels.
