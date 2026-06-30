'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { profileApi } from '@/lib/admin/admin-api';
import { useAuthStore } from '@/store/auth-store';
import { SUPPORTED_LOCALES, type AdminLocale } from '@/i18n/messages';
import { ApiClientError } from '@/lib/api';

const LOCALE_LABELS: Record<AdminLocale, string> = {
  en: 'English',
  bn: 'বাংলা',
  ar: 'العربية',
};

export function LocaleSwitcher() {
  const locale = useLocale() as AdminLocale;
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const next = (() => {
    const i = SUPPORTED_LOCALES.indexOf(locale);
    return SUPPORTED_LOCALES[(i + 1) % SUPPORTED_LOCALES.length] as AdminLocale;
  })();

  const switchLocale = useMutation({
    mutationFn: (newLocale: AdminLocale) =>
      profileApi.update({ locale: newLocale }),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      // Update auth store so I18nProvider picks up the change immediately
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        locale: data.locale,
        timezone: data.timezone,
        hasPassword: data.hasPassword,
        hasGoogle: data.hasGoogle,
        isAdmin: data.isAdmin,
        createdAt: data.createdAt,
      });
    },
    onError: (e) => {
      toast.error(e instanceof ApiClientError ? e.message : 'Could not switch locale');
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending || switchLocale.isPending}
      onClick={() => startTransition(() => switchLocale.mutate(next))}
      aria-label={`Switch to ${LOCALE_LABELS[next]}`}
      className="gap-1.5"
    >
      <Languages className="size-4" />
      <span className="hidden text-xs font-medium sm:inline">{LOCALE_LABELS[locale]}</span>
    </Button>
  );
}
