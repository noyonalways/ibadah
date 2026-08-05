## Context

The application needs a dedicated public showcase page at `/ai` to highlight its AI-powered features, present how the AI engine retrieves and verifies authentic Islamic knowledge, and provide an interactive demo for visitors. 

Existing public landing pages sit under `client/src/app/[locale]/` (e.g., `about`, `features`, `releases`, `faq`). We will align with the existing App Router localization pattern (`[locale]`) and UI design system (Tailwind CSS, Lucide icons, Framer Motion animations / Tailwind transitions).

## Goals / Non-Goals

**Goals:**
- Create a dedicated, highly visual `/ai` showcase page route (`client/src/app/[locale]/ai/page.tsx`).
- Include interactive sections: AI Hero, Core AI Capabilities Grid, "How It Works" RAG Architecture breakdown, Live Sandbox/Demo component, Authenticity & Safety Commitment, and AI FAQ.
- Integrate the AI Showcase page link into the landing header navigation and site footer.
- Provide comprehensive localization support in `messages/en.json`.

**Non-Goals:**
- Replacing or modifying the actual backend AI API endpoints.
- Requiring user login to explore the showcase page or interact with the demo sandbox.

## Decisions

### 1. Route Path: `[locale]/ai`
- **Choice**: Use `/[locale]/ai` as the dedicated public route.
- **Rationale**: Short, memorable, clean, and directly aligned with modern SaaS/application showcase standards (`/ai`).
- **Alternatives Considered**: `/ai-features` or `/ai-showcase`. `/ai` is cleaner and easier to locate.

### 2. Component Structure
- **Choice**: Modular client/server component separation in `client/src/components/ai-showcase/`:
  - `ai-hero-section.tsx`: Hero section with gradient titles, badging, and primary CTAs.
  - `ai-feature-grid.tsx`: Visual breakdown of main AI functionalities.
  - `ai-how-it-works.tsx`: Step-by-step breakdown of knowledge retrieval and safety guardrails.
  - `ai-interactive-sandbox.tsx`: Interactive demo simulator allowing visitors to click prompt chips and view sample answers with source citations.
  - `ai-authenticity-trust.tsx`: Visual cards detailing source verification (Quran, Sahih collections, Tafsir).
  - `ai-faq.tsx`: Expandable FAQ accordion for AI-related user questions.
- **Rationale**: Keeps the route page clean while enabling rich interactive elements via React client components.

### 3. Navigation Integration
- **Choice**: Add an "AI" / "AI Features" item to the main client header nav menu and footer column links.

## Risks / Trade-offs

- **[Risk]**: Demo sandbox might be mistaken for a full live unconstrained chat session.
  - **Mitigation**: Add a clear "Interactive Demo" label and provide quick-action prompts with simulated streaming text and source badges, along with a CTA to sign in/get started for full AI access.
