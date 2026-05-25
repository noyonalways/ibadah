'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';

export function MarketingNav() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">{t('Brand.name')}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t('Brand.tagline')}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#pillars" className="transition-colors hover:text-foreground">
            Pillars
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            {t('Nav.features')}
          </a>
          <a href="#verse" className="transition-colors hover:text-foreground">
            Reflection
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleSwitcher />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t('Nav.login')}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep shadow-lg shadow-primary/30 hover:shadow-primary/50"
          >
            <Link href="/register">{t('Nav.register')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
