'use client';

import { useTranslations } from 'next-intl';
import { Moon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function MarketingNav() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Moon className="size-4" />
          </span>
          <span className="text-lg tracking-tight">{t('Brand.name')}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            {t('Nav.features')}
          </a>
          <a href="#about" className="transition-colors hover:text-foreground">
            {t('Nav.about')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t('Nav.login')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t('Nav.register')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
