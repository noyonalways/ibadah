## Why

When users visit the application on desktop or mobile devices, there is no prominent or interactive prompt guiding them to install the web application as a Progressive Web App (PWA) directly to their device home screen or desktop apps. Adding an interactive PWA install prompt in the bottom-right corner improves user retention, engagement, and accessibility across all platforms.

## What Changes

- Add a custom, interactive PWA installation pop-up component positioned fixed in the bottom-right corner of the client landing page.
- Listen for the browser `beforeinstallprompt` event on both desktop and mobile devices to capture and defer the native installation prompt, triggering it when the user clicks the install button.
- Provide a smooth visual prompt with action buttons ("Install App" and "Dismiss/Close"), custom branding, and automatic dismissal once installed or closed.
- Persist dismissal preferences in `localStorage` so users who dismiss the prompt are not repeatedly interrupted.
- Support internationalization (i18n) via `next-intl` messages for English and Bengali (en.json, bn.json).

## Capabilities

### New Capabilities
- `pwa-install-prompt`: Interactive PWA install prompt pop-up component listening to native `beforeinstallprompt` events and enabling 1-click PWA installation on desktop and mobile.

### Modified Capabilities

## Impact

- Affected code: `client/src/components/pwa/pwa-install-prompt.tsx` (new component), `client/src/app/[locale]/layout.tsx` (or landing page root), and `client/messages/en.json` & `bn.json`.
- Dependencies: Standard browser `beforeinstallprompt` and `appinstalled` events, `localStorage`.
