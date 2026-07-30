## Why

The current landing page hero section feels basic, statically aligned, and lacks the visual polish expected from top-tier modern web applications. Users landing on Ibadah should be immediately inspired by a modern, high-grade aesthetic, rich ambient lighting, interactive preview tabs, and clear value propositions prioritizing privacy and ease of worship tracking.

## What Changes

- **Modern Visual Design & Lighting**: Add ambient radial aura glows, refined typography hierarchy, and a live feature pill with pulse animation.
- **Enhanced Value Proposition & CTAs**: Redesign CTA buttons with glowing gradient rings, subtle hover animations, and trust indicator badges ("100% Free & Private", "No Ads").
- **Interactive Multi-Tab Hero Preview**: Upgrade `HeroPreview` from a static card to a sleek interactive glassmorphism app showcase with tab switching (Salah Log, Dhikr Counter, Quran Progress) and animated progress rings.
- **Upgraded Proof & Metrics Bar**: Transform stats into sleek glassmorphic micro-cards featuring icons, high-contrast metrics, and micro-animations.

## Capabilities

### New Capabilities
- `landing-hero-ui`: Modernized landing hero section featuring ambient lighting, interactive multi-tab app preview, refined CTA styling, and trust micro-cards.

### Modified Capabilities

## Impact

- `client/src/components/landing/hero.tsx`: Upgraded hero layout, typography, CTAs, and background glow effects.
- `client/src/components/landing/hero-preview.tsx`: Modernized interactive preview component with tab navigation and live state.
- `client/messages/*.json`: Additional hero translation strings for CTA trust badges and interactive preview tabs.
