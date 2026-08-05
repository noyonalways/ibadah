## Context

The current landing hero component (`Hero` & `HeroPreview`) provides basic layout elements but lacks modern visual polish, interactive engagement, and high-impact design styling. We are upgrading the hero section with dynamic lighting, an interactive multi-tab app preview, refined CTA styling, and glassmorphic stat cards.

## Goals / Non-Goals

**Goals:**
- Implement vibrant ambient backdrop lighting with layered radial gradients.
- Add an interactive tab bar to `HeroPreview` allowing live switching between Salah, Dhikr, and Quran progress.
- Redesign primary & secondary CTAs with glowing aura effects and trust badges ("100% Private", "No Ads", "Free Forever").
- Upgrade stats display into glassmorphic cards with icons and rich typography.

**Non-Goals:**
- Modifying backend authentication or database APIs (hero preview continues utilizing existing stats & live auth queries).

## Decisions

### 1. Multi-Tab Hero Preview Navigation
**Decision:** Enhance `HeroPreview` with tab state (`salah` | `dhikr` | `quran`).
- **Rationale:** Gives prospective users immediate interactive proof of app capabilities without forcing them to scroll down or register first.

### 2. Ambient Aura Grid Backdrop
**Decision:** Add layered radial gradient circles and a subtle geometric grid overlay in `Hero`.
- **Rationale:** Delivers a premium, state-of-the-art dark mode aesthetic consistent with modern web design standards.

### 3. Glassmorphic Micro-Cards for Hero Metrics
**Decision:** Replace plain text stats with `glass-card` micro-cards featuring Lucide icons (Sparkles, Globe, Heart).
- **Rationale:** Improves readability, visual hierarchy, and scannability.

## Risks / Trade-offs

- **[Performance / Animation Overhead]** → Keep blur radii and CSS transitions optimized using hardware-accelerated transforms (`transform-gpu`, `will-change`).
