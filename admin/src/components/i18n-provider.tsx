'use client';

/**
 * Wires `next-intl` into the admin panel without URL-based routing.
 *
 * The active locale flows like this:
 *
 *   1. On boot, read the persisted locale from `localStorage` (set by
 *      auth-store after the user signs in or saves Settings).
 *   2. Subscribe to the auth store so every profile mutation
 *      (Settings page or the header dropdown) is mirrored here in the
 *      same render cycle, without a page refresh.
 *   3. Apply `<html lang>` and `<html dir>` so RTL kicks in for Arabic
 *      and screen readers / spellcheck pick the right language.
 *
 * Catalogs are statically imported (see `i18n/messages.ts`) so a switch
 * is instant — no async chunk fetch, no flash of English while loading.
 */
import { useEffect, useMemo } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useAuthStore } from '@/store/auth-store';
import {
  DEFAULT_LOCALE,
  MESSAGES,
  RTL_LOCALES,
  isSupportedLocale,
  type AdminLocale,
} from '@/i18n/messages';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Read the locale straight from the auth store — it's already
  // hydrated from localStorage on first paint by `auth-storage.ts`,
  // so this avoids a "wrong-locale flash" while we wait for the
  // profile fetch to complete.
  const userLocale = useAuthStore((s) => s.user?.locale);

  const locale: AdminLocale = useMemo(
    () => (isSupportedLocale(userLocale) ? userLocale : DEFAULT_LOCALE),
    [userLocale],
  );

  // Reflect the locale on <html> so:
  //   - assistive tech / spellcheckers pick the right language
  //   - Arabic gets a proper RTL layout (forms, sidebars, lucide icons)
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="UTC"
      // Without an explicit `now`, next-intl warns about hydration when
      // formatting relative times on the server vs client. We don't
      // SSR-format anything here, so a stable epoch suffices.
      now={new Date(0)}
      onError={(err) => {
        // Swallow MISSING_MESSAGE in dev so a missing key doesn't
        // crash the panel; fall back to the key itself instead.
        if (err.code === 'MISSING_MESSAGE') return;
        // eslint-disable-next-line no-console
        console.error('[i18n]', err);
      }}
      getMessageFallback={({ key, namespace }) =>
        namespace ? `${namespace}.${key}` : key
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}
