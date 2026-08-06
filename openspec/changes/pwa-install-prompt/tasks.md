## 1. PWA State Management & Event Handling

- [x] 1.1 Create `usePWAInstall` hook (`client/src/hooks/use-pwa-install.ts`) to manage `beforeinstallprompt`, `appinstalled`, standalone display check, iOS agent detection, and `localStorage` dismissal state.

## 2. Localization (i18n)

- [x] 2.1 Add PWA prompt translations (`title`, `description`, `installButton`, `dismissButton`, `iosInstructions`) to `client/messages/en.json` and `client/messages/bn.json`.

## 3. PWA Install Prompt UI Component

- [x] 3.1 Create `PWAInstallPrompt` component (`client/src/components/pwa/pwa-install-prompt.tsx`) styled with glassmorphism and fixed positioning in the bottom-right corner (`fixed bottom-4 right-4 z-50`).
- [x] 3.2 Implement standard PWA install dialog trigger on click of Install action button.
- [x] 3.3 Implement iOS Safari fallback UI step instructions when native `beforeinstallprompt` is unsupported on iOS devices.

## 4. Integration & Build Verification

- [x] 4.1 Mount `PWAInstallPrompt` into `client/src/app/[locale]/layout.tsx`.
- [x] 4.2 Run TypeScript typecheck (`npm run typecheck`) and Next.js lint/build check in `client` directory.
