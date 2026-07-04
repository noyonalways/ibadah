'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
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
    { href: anchor('pillars'), label: t('Nav.pillars'), isAnchor: true },
    { href: anchor('how'), label: t('Nav.tracking'), isAnchor: true },
    { href: '/features', label: t('Nav.features'), isAnchor: false },
    { href: '/faq', label: t('Nav.faq'), isAnchor: false },
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
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)] sm:h-16">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <BrandMark size={28} className="shrink-0 sm:hidden" />
          <BrandMark size={32} className="hidden shrink-0 sm:block" />
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              {t('Brand.name')}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
              {t('Brand.tagline')}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href={anchor('pillars')} className="transition-colors hover:text-foreground">
            {t('Nav.pillars')}
          </a>
          <Link href="/features" className="transition-colors hover:text-foreground">
            {t('Nav.features')}
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground">
            {t('Nav.about')}
          </Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">
            {t('Nav.faq')}
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1.5 md:flex">
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
                {t('Nav.dashboard')}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
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
        </div>

        {/* Mobile menu trigger — sole control in the header bar below md */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-marketing-nav"
          aria-label={open ? t('Common.close') : t('Common.more')}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
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
            <li className="mb-2 flex items-center justify-end gap-1 border-b border-border/60 pb-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </li>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                {l.isAnchor ? (
                  <a
                    href={l.href}
                    className="block rounded-lg px-3 py-2.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    href={l.href}
                    className="block rounded-lg px-3 py-2.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                )}
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
