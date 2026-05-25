import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'bn', 'ar'],
  defaultLocale: 'en',
  // Always show /en, /bn, /ar in the URL for clarity & SEO
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];

export const localeMeta: Record<AppLocale, { label: string; nativeLabel: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr' },
  bn: { label: 'Bangla', nativeLabel: 'বাংলা', dir: 'ltr' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
};

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
