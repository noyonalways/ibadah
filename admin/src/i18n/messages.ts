/**
 * Static-imported message catalogs. We bundle all three because the
 * admin panel doesn't use URL-based locale routing — the active locale
 * is read from the authenticated user's profile, which can change at
 * runtime when they edit it in Settings. Static imports keep the
 * locale-switch instant (no async chunk fetch) and cost ~30 KB total.
 */
import en from '../../messages/en.json';
import bn from '../../messages/bn.json';
import ar from '../../messages/ar.json';

export const SUPPORTED_LOCALES = ['en', 'bn', 'ar'] as const;
export type AdminLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AdminLocale = 'en';

export const RTL_LOCALES = new Set<AdminLocale>(['ar']);

type Messages = typeof en;

export const MESSAGES: Record<AdminLocale, Messages> = {
  en,
  bn: bn as Messages,
  ar: ar as Messages,
};

export function isSupportedLocale(value: unknown): value is AdminLocale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}
