'use client';

import * as React from 'react';
import {
  BookOpen,
  CheckCircle2,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  LogOut,
  MoreHorizontal,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-auth';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type AppHref =
  | '/dashboard'
  | '/salah'
  | '/quran'
  | '/dhikr'
  | '/habits'
  | '/checklist'
  | '/settings';

interface NavItem {
  href: AppHref;
  labelKey: string;
  icon: LucideIcon;
}

const PRIMARY: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard },
  { href: '/salah', labelKey: 'Nav.salah', icon: CheckCircle2 },
  { href: '/quran', labelKey: 'Nav.quran', icon: BookOpen },
  { href: '/dhikr', labelKey: 'Nav.dhikr', icon: HandHeart },
];

const MORE_ITEMS: NavItem[] = [
  { href: '/habits', labelKey: 'Nav.habits', icon: ListChecks },
  { href: '/checklist', labelKey: 'Nav.checklist', icon: ListTodo },
  { href: '/settings', labelKey: 'Nav.settings', icon: Settings },
];

export function MobileBottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const isOnMorePage = MORE_ITEMS.some((m) => pathname === m.href);

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <>
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 lg:hidden',
          'border-t border-border/60 bg-background/85 backdrop-blur-xl',
          'pb-[env(safe-area-inset-bottom)]',
        )}
        aria-label="Primary"
      >
        <div className="mx-auto flex h-16 max-w-2xl items-stretch justify-around px-2">
          {PRIMARY.map((item) => (
            <BottomNavLink key={item.href} item={item} active={pathname === item.href} t={t} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'group relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors',
              isOnMorePage || moreOpen ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-label={t('Common.more')}
            aria-expanded={moreOpen}
          >
            <span
              className={cn(
                'relative grid h-7 w-12 place-items-center rounded-full transition-colors',
                (isOnMorePage || moreOpen) && 'bg-primary/15',
              )}
            >
              <MoreHorizontal className="size-5" />
            </span>
            <span className="text-[10px] font-medium tracking-tight">{t('Common.more')}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('Common.more')}</SheetTitle>
            <SheetDescription>{t('Nav.preferences')}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-1 px-3 py-3">
            {MORE_ITEMS.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname === href;
              return (
                <SheetClose asChild key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors active:scale-[0.99]',
                      active
                        ? 'bg-gradient-to-r from-primary/15 via-primary/5 to-transparent text-foreground'
                        : 'text-foreground/85 hover:bg-muted/60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-lg',
                        active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    {t(labelKey)}
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          <div className="border-t border-border/60 px-5 py-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t('Nav.preferences')}
            </p>
            <div className="flex items-center justify-between gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
              >
                <LogOut className="size-3.5" />
                {t('Nav.logout')}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BottomNavLink({
  item,
  active,
  t,
}: {
  item: NavItem;
  active: boolean;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'relative grid h-7 w-12 place-items-center rounded-full transition-all duration-300',
          active && 'bg-primary/15',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className={cn('text-[10px] font-medium tracking-tight', active && 'font-semibold')}>
        {t(item.labelKey)}
      </span>
    </Link>
  );
}
