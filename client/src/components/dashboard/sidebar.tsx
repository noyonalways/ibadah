'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpen,
  CheckCircle2,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { BrandMark } from '@/components/shared/brand-mark';
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

const PRIMARY: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard },
  { href: '/salah', labelKey: 'Nav.salah', icon: CheckCircle2 },
  { href: '/quran', labelKey: 'Nav.quran', icon: BookOpen },
  { href: '/dhikr', labelKey: 'Nav.dhikr', icon: HandHeart },
  { href: '/habits', labelKey: 'Nav.habits', icon: ListChecks },
  { href: '/checklist', labelKey: 'Nav.checklist', icon: ListTodo },
];

const SECONDARY: NavItem[] = [
  { href: '/settings', labelKey: 'Nav.settings', icon: Settings },
];

export function DashboardSidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/60 px-5">
        <BrandMark size={32} />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">{t('Brand.name')}</span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {t('Brand.tagline')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <NavGroup label="Tracking" items={PRIMARY} pathname={pathname} t={t} />
        <NavGroup label="Account" items={SECONDARY} pathname={pathname} t={t} />
      </div>

      {/* Subtle inspirational footer */}
      <div className="shrink-0 border-t border-border/60 p-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 text-center">
          <p
            className="font-display text-sm leading-relaxed text-foreground/80"
            dir="rtl"
            lang="ar"
          >
            ٱلْحَمْدُ لِلَّٰهِ
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            All praise is due to Allah
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  t,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
        {label}
      </p>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {/* Active accent rail */}
              {active && (
                <span
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary to-accent"
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  'size-4 transition-colors',
                  active ? 'text-primary' : 'group-hover:text-foreground',
                )}
              />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
