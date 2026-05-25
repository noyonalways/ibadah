'use client';

import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';

export function DashboardTopbar() {
  const t = useTranslations('Nav');
  const { user } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Initials for avatar fallback
  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary via-primary-soft to-accent-deep text-sm font-semibold text-primary-foreground shadow-sm">
              {initials}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-[11px] text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <LocaleSwitcher />
        <ThemeToggle />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </Button>
      </div>
    </header>
  );
}
