'use client';

import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/use-auth';
import { usePathname } from '@/i18n/routing';
import { BrandMark } from '@/components/shared/brand-mark';
import { ThemeToggle } from '@/components/layout/theme-toggle';

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

  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '·';

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl pt-[env(safe-area-inset-top)] lg:hidden"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={28} />
        <div className="flex min-w-0 flex-col leading-none">
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {t('Brand.name')}
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <span
          className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary via-primary-soft to-accent-deep text-xs font-semibold text-primary-foreground shadow-sm"
          aria-label={user?.name ?? 'Account'}
        >
          {initials}
        </span>
      </div>
    </header>
  );
}
