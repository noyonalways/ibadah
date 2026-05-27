'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  FileText,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Scale,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Stamped onto the item when the route still depends on a future server endpoint. */
  pending?: boolean;
}

const OPERATIONS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users, pending: true },
  { href: '/salah', label: 'Salah', icon: CheckCircle2 },
  { href: '/quran', label: 'Quran', icon: BookOpen },
  { href: '/dhikr', label: 'Dhikr', icon: HandHeart },
  { href: '/habits', label: 'Habits', icon: ListChecks },
  { href: '/checklist', label: 'Checklist', icon: ListTodo },
];

const SYSTEM: NavItem[] = [
  { href: '/scoring', label: 'Scoring', icon: Scale },
  { href: '/moderation', label: 'Moderation', icon: ShieldCheck, pending: true },
  { href: '/audit', label: 'Audit Log', icon: FileText, pending: true },
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
        <NavGroup label="Operations" items={OPERATIONS} pathname={pathname} />
        <NavGroup label="System" items={SYSTEM} pathname={pathname} />
      </div>

      <div className="shrink-0 border-t border-border/60 p-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Internal · v0.1
          </p>
          <p className="mt-1 text-xs text-foreground/80">Operate with care</p>
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
        {items.map(({ href, label: itemLabel, icon: Icon, pending }) => {
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
              {pending && (
                <span
                  className="rounded-full border border-border/60 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground"
                  title="Requires admin endpoints not yet implemented on the server"
                >
                  api
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
