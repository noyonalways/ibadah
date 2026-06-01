'use client';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ProfileMenu } from '@/components/dashboard/profile-menu';

/**
 * Desktop-only top bar. The mobile experience uses MobileTopbar +
 * MobileBottomNav for a more native-feeling app shell.
 * 
 * Design follows admin topbar pattern with locale switcher and theme toggle
 * on the left side of the profile menu.
 */
export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:flex lg:px-8">
      <div className="flex items-center gap-2">
        {/* Empty left side - can be used for menu button or branding if needed */}
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
