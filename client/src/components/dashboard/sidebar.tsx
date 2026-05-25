'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpen,
  CheckCircle2,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Moon,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface NavItem {
  href:
    | '/dashboard'
    | '/salah'
    | '/quran'
    | '/dhikr'
    | '/habits'
    | '/checklist'
    | '/settings';
  labelKey: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard },
  { href: '/salah', labelKey: 'Nav.salah', icon: CheckCircle2 },
  { href: '/quran', labelKey: 'Nav.quran', icon: BookOpen },
  { href: '/dhikr', labelKey: 'Nav.dhikr', icon: HandHeart },
  { href: '/habits', labelKey: 'Nav.habits', icon: ListChecks },
  { href: '/checklist', labelKey: 'Nav.checklist', icon: ListTodo },
  { href: '/settings', labelKey: 'Nav.settings', icon: Settings },
];

export function DashboardSidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card/30 lg:block">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Moon className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">{t('Brand.name')}</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
