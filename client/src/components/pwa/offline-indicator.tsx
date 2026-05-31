'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloudOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Subtle, sticky offline indicator. Sits above the bottom navigation
 * on mobile and below the topbar on desktop. Pairs with toasts for
 * online/offline transitions so the state change is felt immediately.
 *
 * Initial mount only shows the banner if `navigator.onLine === false`
 * — no flash on hydration when the user is online.
 */
export function OfflineIndicator() {
  const t = useTranslations('PWA');
  // Default to online to avoid an SSR/CSR mismatch banner flash.
  const [online, setOnline] = useState<boolean>(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const onOnline = () => {
      setOnline(true);
      toast.success(t('back_online'), {
        description: t('back_online_desc'),
        duration: 3500,
      });
    };
    const onOffline = () => {
      setOnline(false);
      toast.error(t('went_offline'), {
        description: t('went_offline_desc'),
        duration: 4500,
      });
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [t]);

  if (!hasMounted || online) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3',
        // Sit above the mobile bottom nav (h-16 + safe-area), below
        // the desktop top bar.
        'bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] lg:bottom-4',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50/95 px-3.5 py-1.5 text-xs font-medium text-amber-900 shadow-lg shadow-amber-500/10 backdrop-blur dark:border-amber-400/30 dark:bg-amber-950/80 dark:text-amber-100">
        <CloudOff className="size-3.5" />
        <span>{t('offline_banner')}</span>
        <span className="mx-1 hidden h-3 w-px bg-amber-500/30 sm:inline" aria-hidden />
        <button
          type="button"
          onClick={() => {
            // Try once — if the network came back without firing the
            // event, this gives the user immediate feedback.
            if (navigator.onLine) {
              window.location.reload();
            }
          }}
          className="hidden items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-900 transition-colors hover:bg-amber-500/25 sm:inline-flex dark:bg-amber-400/15 dark:text-amber-100"
        >
          <Wifi className="size-3" />
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
