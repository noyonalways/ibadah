'use client';

import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/use-auth';
import { usePathname } from '@/i18n/routing';
import { BrandMark } from '@/components/shared/brand-mark';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Avatar } from '@/components/ui/avatar';

const TITLE_BY_PATH: Record<string, string> = {
  '/dashboard': 'Nav.dashboard',
  '/salah': 'Nav.salah',
  '/quran': 'Nav.quran',
  '/dhikr': 'Nav.dhikr',
  '/habits': 'Nav.habits',
  '/checklist': 'Nav.checklist',
  '/settings': 'Nav.settings',
};

/**
 * Material-style top app bar shown only on mobile/tablet. Brand on the left,
 * page title centered, theme toggle + avatar on the right. The desktop
 * sidebar + topbar already cover the lg+ layout.
 */
export function MobileTopbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { user } = useCurrentUser();

  const titleKey = TITLE_BY_PATH[pathname] ?? 'Brand.name';
  const title = t(titleKey);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <BrandMark size={28} className="shrink-0" />
        <div className="flex min-w-0 flex-col leading-none">
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {t('Brand.name')}
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <Avatar src={user?.avatarUrl} name={user?.name} size={36} rounded="full" />
      </div>
    </header>
  );
}
