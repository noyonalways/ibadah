## ADDED Requirements

### Requirement: Interactive PWA Install Prompt Display
The client landing page SHALL display an interactive, styled PWA install pop-up card fixed in the bottom-right corner when the browser detects the application can be installed as a PWA and fires the `beforeinstallprompt` event.

#### Scenario: Displaying prompt on initial visit
- **WHEN** a user visits the application on a PWA-supported device/browser and the application is not yet installed
- **THEN** the system SHALL capture the `beforeinstallprompt` event and render an interactive pop-up card in the bottom-right corner prompting the user to install the application.

#### Scenario: Standalone mode suppression
- **WHEN** the application is already running in PWA standalone display mode or `display-mode: standalone` media query matches
- **THEN** the prompt card SHALL NOT be displayed to the user.

### Requirement: Triggering PWA Installation
The PWA install prompt card SHALL contain an "Install" button that, when clicked, triggers the native browser PWA installation dialog.

#### Scenario: User clicks Install button
- **WHEN** the user clicks the "Install" action button on the pop-up card
- **THEN** the system SHALL invoke the `prompt()` method on the deferred `beforeinstallprompt` event and hide the pop-up card upon completion of user choice.

### Requirement: Dismissing and Suppression
The PWA install prompt card SHALL allow users to minimize or close the pop-up, persisting the user's preference to prevent repeated interruptions during the session or within a specified time frame.

#### Scenario: User minimizes prompt
- **WHEN** the user clicks the minimize button on the pop-up card
- **THEN** the pop-up card SHALL collapse into a compact floating pill above the AI button, which expands back to full view when clicked.

#### Scenario: User dismisses prompt
- **WHEN** the user clicks the close button or "Not Now" action on the pop-up card
- **THEN** the pop-up card SHALL hide immediately and store a dismissal timestamp in `localStorage` to suppress the prompt from showing again for a configured duration.

### Requirement: Automatic Dismissal on App Installed Event
The application SHALL listen for the `appinstalled` event and automatically hide the prompt card if the app installation completes successfully.

#### Scenario: Installation completes successfully
- **WHEN** the browser triggers the `appinstalled` event
- **THEN** the pop-up card SHALL immediately hide and clear any pending deferred prompt reference.
