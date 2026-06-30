'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandMark } from '@/components/shared/brand-mark';
import { useCurrentUser } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

/**
 * Top-of-page marketing nav. Becomes opaque + bordered after the user
 * scrolls a small amount, and exposes a slide-down mobile drawer below
 * `md`. Anchor links work from any page (they prefix `/` automatically).
 */
export function MarketingNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Reflect the active session in the nav so a logged-in visitor sees a
  // shortcut into the app instead of being sent back through /login.
  // `hasHydrated` guards against a hydration mismatch: the server and the
  // first client render both show the logged-out buttons, then we swap to
  // the authenticated state once the persisted store is read.
  const { user, hasHydrated } = useCurrentUser();
  const isAuthed = hasHydrated && !!user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // On the home page, anchor links scroll within the page. On other
  // pages, prefix with `/` so they navigate home and then scroll.
  const isHome = pathname === '/';
  const anchor = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  const NAV_LINKS = [
    { href: anchor('pillars'), label: t('Nav.pillars') },
    { href: anchor('how'), label: t('Nav.tracking') },
    { href: anchor('features'), label: t('Nav.features') },
    { href: anchor('faq'), label: t('Nav.faq'), isAnchor: true },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/70 backdrop-blur-xl'
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href={anchor('pillars')} className="transition-colors hover:text-foreground">
            {t('Nav.pillars')}
          </a>
          <a href={anchor('features')} className="transition-colors hover:text-foreground">
            {t('Nav.features')}
          </a>
          <Link href="/about" className="transition-colors hover:text-foreground">
            {t('Nav.about')}
          </Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">
            {t('Nav.faq')}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleSwitcher />
          <ThemeToggle />
          {isAuthed ? (
            <Button
              asChild
              size="sm"
              className="gap-2 rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              <Link href="/dashboard">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.name}
                  size={22}
                  rounded="full"
                  className="-ml-1"
                />
                <span className="hidden sm:inline">{t('Nav.dashboard')}</span>
                <LayoutDashboard className="size-4 sm:hidden" />
              </Link>
            </Button>
          ) : (
            <>
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
            </>
          )}

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-marketing-nav"
            aria-label={open ? t('Common.close') : t('Common.more')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer — animates open/close */}
      <div
        id="mobile-marketing-nav"
        className={cn(
          'overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl transition-[grid-template-rows] duration-300 md:hidden',
          'grid',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <nav className="min-h-0 overflow-hidden">
          <ul className="container mx-auto flex flex-col gap-1 px-4 py-4 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/about"
                className="block rounded-lg px-3 py-2.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                {t('Nav.about')}
              </Link>
            </li>
            {isAuthed ? (
              <li className="mt-2 px-3">
                <Button
                  asChild
                  size="sm"
                  className="w-full gap-2 rounded-full bg-gradient-to-r from-primary to-accent-deep"
                >
                  <Link href="/dashboard">
                    <Avatar
                      src={user?.avatarUrl}
                      name={user?.name}
                      size={22}
                      rounded="full"
                      className="-ml-1"
                    />
                    {t('Nav.dashboard')}
                  </Link>
                </Button>
              </li>
            ) : (
              <li className="mt-2 flex gap-2 px-3">
                <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
                  <Link href="/login">{t('Nav.login')}</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent-deep"
                >
                  <Link href="/register">{t('Nav.register')}</Link>
                </Button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
