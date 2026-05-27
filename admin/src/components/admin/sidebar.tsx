'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Flame,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ANALYTICS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/active-users', label: 'Active users', icon: UserCheck },
];

const MANAGE: NavItem[] = [
  { href: '/users', label: 'Users', icon: Users },
  { href: '/defaults', label: 'Defaults', icon: Sparkles },
];

const SYSTEM: NavItem[] = [
  { href: '/system', label: 'System', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/60 px-5">
        <BrandMark size={32} />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">Ibadah Admin</span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            Operations Console
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <NavGroup label="Analytics" items={ANALYTICS} pathname={pathname} />
        <NavGroup label="Manage" items={MANAGE} pathname={pathname} />
        <NavGroup label="System" items={SYSTEM} pathname={pathname} />
      </div>

      <div className="shrink-0 border-t border-border/60 p-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 text-center">
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
            <ShieldCheck className="size-3" />
            Admin only
          </div>
          <p className="text-xs text-foreground/80">Operate with care</p>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
        {label}
      </p>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
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
              <span className="flex-1">{itemLabel}</span>
              {/* Active streak indicator on Dashboard */}
              {href === '/dashboard' && active && (
                <Flame className="size-3 text-accent-deep" aria-hidden />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
