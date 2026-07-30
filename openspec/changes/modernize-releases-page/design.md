## Context

The current releases page uses a simple vertical list of release cards with basic date and version information. To provide a modern, engaging experience matching top-tier developer platforms (like Vercel, Linear, GitHub), we are redesigning `/releases` with version serial tracking, a metrics overview header, category filtering, instant search, and visual animations.

## Goals / Non-Goals

**Goals:**
- Add dynamic version serial badges (`Serial #01`, `Serial #02`, etc.) indicating chronological order.
- Implement a metrics overview header (Total releases, Latest version, Last update date, entry counts).
- Add real-time client-side search and category filtering (All, Features, Enhancements, Fixes).
- Build a modern timeline UI with glowing gradients, hero highlight for the latest release, and copy-version actions.
- Support full internationalization (i18n) for controls, filter labels, and empty states.

**Non-Goals:**
- Schema changes to backend MongoDB model (serial index can be calculated dynamically from existing data).
- Admin editing UI for release notes (releases remain seeded via git history / startup migration).

## Decisions

### 1. Dynamic Serial Number Calculation
**Decision:** Calculate serial numbers client-side in reverse chronological order: `serialNumber = totalCount - index`.
- **Rationale:** Keeps API backend clean and avoids mutating DB schema while guaranteeing accurate sequence numbers as new releases are appended.

### 2. Interactive Search & Filter Controls
**Decision:** Store `searchQuery` and `selectedCategory` in local component state within `ReleasesTimeline`. Filter entries per release card dynamically.
- **Rationale:** Instant client-side responsiveness without extra network roundtrips.

### 3. Modern Aesthetic Design System
**Decision:** Utilize existing glassmorphism CSS tokens (`bg-card/60`, `backdrop-blur`, `glass-card`), ambient gradient glows, Lucide icons, and animated entry transitions.
- **Rationale:** Fits seamlessly into the existing sleek dark/light design system while lifting the releases page to a premium visual standard.

## Risks / Trade-offs

- **[Filtering hides releases]** → If search query matches zero items, render a clear, friendly "No matching releases found" state with a button to reset filters.
- **[Empty API state]** → Preserve loading skeletons and empty state fallback for initial deployments.
