## 1. i18n & Navigation Setup

- [x] 1.1 Add AI Showcase translation strings under `AiShowcase` namespace in `messages/en.json`.
- [x] 1.2 Add navigation link configuration for AI Showcase (`/ai`) in client landing navigation data/components.

## 2. AI Showcase UI Components

- [x] 2.1 Build `AiHeroSection` component in `client/src/components/ai-showcase/ai-hero-section.tsx` with high-impact hero header, badge, and CTA buttons.
- [x] 2.2 Build `AiFeatureGrid` component in `client/src/components/ai-showcase/ai-feature-grid.tsx` featuring visual cards for core AI capabilities (Q&A Assistant, Quran/Hadith Context, Worship Insights).
- [x] 2.3 Build `AiHowItWorks` component in `client/src/components/ai-showcase/ai-how-it-works.tsx` showing the step-by-step RAG architecture & verification pipeline.
- [x] 2.4 Build `AiInteractiveSandbox` component in `client/src/components/ai-showcase/ai-interactive-sandbox.tsx` offering interactive prompt chip testing with simulated AI responses and citations.
- [x] 2.5 Build `AiAuthenticityTrust` component in `client/src/components/ai-showcase/ai-authenticity-trust.tsx` explaining authentic source sourcing and scholar verification guardrails.
- [x] 2.6 Build `AiFaq` component in `client/src/components/ai-showcase/ai-faq.tsx` presenting interactive FAQ accordion items for AI functionality and source authenticity.

## 3. Dedicated Route & Landing Page Integration

- [x] 3.1 Create dedicated showcase route in `client/src/app/[locale]/ai/page.tsx` assembling all AI showcase sections into a seamless page layout.
- [x] 3.2 Update client header navbar and footer to feature "AI Features" link pointing to `/[locale]/ai`.

## 4. Verification & Testing

- [x] 4.1 Run TypeScript type check and build verification for the client application.
- [x] 4.2 Verify navigation flow and responsiveness of the `/ai` route across desktop and mobile screen sizes.
