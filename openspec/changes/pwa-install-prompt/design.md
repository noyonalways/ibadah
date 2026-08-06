## Context

The Next.js client application (`client`) is configured with a PWA manifest (`src/app/manifest.ts`) and service worker (`public/sw.js`). However, browser native installation prompts can be subtle or hidden in browser address bars. To maximize PWA adoption on both desktop and mobile devices, we need a floating pop-up prompt in the bottom-right corner of the application landing page.

## Goals / Non-Goals

**Goals:**
- Intercept the browser `beforeinstallprompt` event and store the deferred event object.
- Provide a responsive, interactive floating pop-up component positioned fixed in the bottom-right corner (`fixed bottom-4 right-4 z-50`).
- Trigger 1-click native PWA installation upon clicking "Install".
- Provide dismissal persistence via `localStorage` to avoid spamming returning visitors.
- Include custom iOS Safari support with explicit steps (Share button -> Add to Home Screen).
- Fully internationalized (i18n) with English (`en`) and Bengali (`bn`) translations.

**Non-Goals:**
- Bypassing browser-enforced PWA installation requirements (HTTPS, active service worker, valid manifest).
- Custom native binary app installation.

## Decisions

### Decision 1: `usePWAInstall` Custom Hook & `PWAInstallPrompt` Component
- Create a dedicated client hook (`src/hooks/use-pwa-install.ts`) that manages:
  - Intercepting `beforeinstallprompt` and `appinstalled` window events.
  - Detecting standalone display mode (`window.matchMedia('(display-mode: standalone)')` or `navigator.standalone`).
  - Persistence checking (`localStorage.getItem('pwa_prompt_dismissed')`).
  - Detecting iOS device user-agent (`navigator.userAgent`).
- Create `src/components/pwa/pwa-install-prompt.tsx` rendered at the root layout (`client/src/app/[locale]/layout.tsx`).

### Decision 2: Bottom-Right Vertical Stack UI
- Use Tailwind CSS v4 and Lucide React icons (`Download`, `X`, `Minus`, `Smartphone`, `Share`).
- Vertical Order on right side:
  - Top: AI Assistant Floating Button (`bottom-20 lg:bottom-20`)
  - Bottom: PWA Install App prompt card / minimized pill (`bottom-4 lg:bottom-6`)
- Design features:
  - Header controls with both Minimize (`Minus`) and Close (`X`) actions.
  - Minimized floating pill button allowing 1-tap restore.
  - Compact glassmorphism/elevated card layout with dark/light mode compatibility.

### Decision 3: Dismissal Logic & Expiration
- Dismissing the pop-up sets `pwa_prompt_dismissed_at` timestamp in `localStorage`.
- Re-prompt interval set to 7 days if dismissed, but auto-hides permanently if app is installed.

## Risks / Trade-offs

- **[Risk]** Browsers like iOS Safari do not support `beforeinstallprompt` → **Mitigation**: Show a lightweight iOS instruction guide card if detected on iOS Safari and not in standalone mode.
- **[Risk]** Pop-up obscuring bottom-right UI elements on mobile screens → **Mitigation**: Add responsive padding (`bottom-4 right-4 left-4 sm:left-auto`), max-width constraints, and allow instant dismissal.
