'use client';

import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { Avatar } from '@/components/ui/avatar';

/**
 * Desktop-only top bar. The mobile experience uses MobileTopbar +
 * MobileBottomNav for a more native-feeling app shell.
 */
export function DashboardTopbar() {
  const t = useTranslations('Nav');
  const { user } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:flex lg:px-8">
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar src={user.avatarUrl} name={user.name} size={36} rounded="full" />
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
          <span>{t('logout')}</span>
        </Button>
      </div>
    </header>
  );
}
