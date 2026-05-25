'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { useRouter, usePathname, routing, localeMeta, type AppLocale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const next = (() => {
    const i = routing.locales.indexOf(locale);
    return routing.locales[(i + 1) % routing.locales.length] as AppLocale;
  })();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => router.replace(pathname, { locale: next }))}
      aria-label={`Switch to ${localeMeta[next].nativeLabel}`}
      className="gap-1.5"
    >
      <Languages className="size-4" />
      <span className="hidden text-xs font-medium sm:inline">{localeMeta[locale].nativeLabel}</span>
    </Button>
  );
}
