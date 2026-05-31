'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Registers the Ibadah service worker (`/sw.js`) and surfaces update
 * prompts to the user. Only active in production builds — Next.js dev
 * mode reshuffles asset URLs on every save and would fight the cache.
 *
 * Update flow:
 *   1. The browser detects a new sw.js byte-for-byte.
 *   2. It downloads + installs into `registration.installing`.
 *   3. When `state === 'installed'` and there is an existing controller,
 *      a new version is *waiting*. We surface a toast with an action
 *      to reload, which posts SKIP_WAITING and waits for the new SW
 *      to take control.
 */
export function ServiceWorkerRegister() {
  const t = useTranslations('PWA');
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Skip dev: hot reload + service worker caching is a footgun.
    if (process.env.NODE_ENV !== 'production') return;

    let cancelled = false;

    const promptUpdate = (worker: ServiceWorker) => {
      toast.info(t('update_available'), {
        description: t('update_description'),
        duration: Infinity,
        action: {
          label: t('update_action'),
          onClick: () => {
            // Tell the waiting SW to take over; the controllerchange
            // listener below will reload the page when it does.
            worker.postMessage({ type: 'SKIP_WAITING' });
          },
        },
      });
    };

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        if (cancelled) return;

        // A worker is already waiting (e.g. previous tab installed it).
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
        }

        // Watch for a brand-new install while this tab is open.
        registration.addEventListener('updatefound', () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (
              next.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              promptUpdate(next);
            }
          });
        });

        // Periodically check for new versions while the app is open.
        // 60-min heartbeat is a sensible default — the browser also
        // checks on navigation.
        const heartbeat = window.setInterval(() => {
          registration.update().catch(() => {
            /* ignore — likely offline */
          });
        }, 60 * 60 * 1000);

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          onControllerChange,
        );

        return () => {
          window.clearInterval(heartbeat);
          navigator.serviceWorker.removeEventListener(
            'controllerchange',
            onControllerChange,
          );
        };
      } catch (err) {
        // Don't surface to the user — a failed SW registration shouldn't
        // break the app. Log for ops.
        // eslint-disable-next-line no-console
        console.warn('[Ibadah] Service worker registration failed:', err);
      }
    };

    let cleanup: (() => void) | undefined;
    register().then((c) => {
      cleanup = c;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // t is stable across renders and Sonner's toast is module-level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
