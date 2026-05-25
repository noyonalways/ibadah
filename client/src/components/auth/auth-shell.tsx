import { Moon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTranslations('Brand');

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[400px] bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl"
        aria-hidden
      />
      <div className="bg-pattern absolute inset-0 -z-20 opacity-30" aria-hidden />

      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Moon className="size-4" />
          </span>
          <span className="text-lg tracking-tight">{t('name')}</span>
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
