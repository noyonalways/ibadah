import { ServiceWorkerRegister } from './sw-register';
import { OfflineIndicator } from './offline-indicator';

/**
 * Mounted once at the root layout. Owns:
 *   - Service worker registration & update prompts.
 *   - Online/offline status banner + transition toasts.
 *
 * Both pieces are no-ops on the server, so this is safe inside a
 * Server Component tree.
 */
export function PwaBootstrap() {
  return (
    <>
      <ServiceWorkerRegister />
      <OfflineIndicator />
    </>
  );
}
