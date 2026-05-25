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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-muted-foreground sm:block">
          {user ? `${user.email}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </Button>
      </div>
    </header>
  );
}
