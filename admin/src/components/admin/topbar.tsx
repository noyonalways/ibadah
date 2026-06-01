'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ProfileMenu } from '@/components/admin/profile-menu';
import { useUiStore } from '@/store/ui-store';

export function AdminTopbar() {
  const t = useTranslations('Nav');
  const toggleMobile = useUiStore((s) => s.toggleMobile);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMobile}
          aria-label={t('openMenu')}
          className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:hidden"
        >
          <Menu className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <LocaleSwitcher />
        <ThemeToggle />
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
        <ProfileMenu />
      </div>
    </header>
  );
}
