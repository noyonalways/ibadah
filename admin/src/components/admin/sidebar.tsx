'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Trimmed nav per the operator's request. Three logical groups, each
 * pointing only at pages that are actively in use:
 *
 *   - Insight   — operator overview (Dashboard) + read-only
 *                  analytics / leaderboard.
 *   - People    — the consolidated Users page (formerly "Active users").
 *   - Operate   — privileged screens that change state or surface
 *                  observability (moderation, audit, system) plus
 *                  the operator's own settings.
 *
 * Scoring config has been removed from the standalone nav — point
 * values are still tunable on a per-user basis via the user's profile
 * payload, but the operations console no longer needs a dedicated
 * page to surface them.
 */
const INSIGHT: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

const PEOPLE: NavItem[] = [{ href: '/users', label: 'Users', icon: Users }];

const OPERATE: NavItem[] = [
  { href: '/moderation', label: 'Moderation', icon: ShieldCheck },
  { href: '/audit', label: 'Audit log', icon: FileText },
  { href: '/system', label: 'System', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <TooltipProvider delayDuration={250}>
        <aside
          className={cn(
            'sticky top-0 z-50 hidden h-dvh shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur transition-[width] duration-200 ease-out lg:flex',
            collapsed ? 'w-[72px]' : 'w-64',
          )}
          aria-label="Primary"
        >
          <SidebarInner
            pathname={pathname}
            collapsed={collapsed}
            onToggle={toggle}
            onMobileClose={() => setMobileOpen(false)}
            isMobile={false}
          />
        </aside>

        {/* Off-canvas mobile drawer */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/60 bg-card shadow-2xl transition-transform duration-200 ease-out lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-hidden={!mobileOpen}
          aria-label="Primary"
        >
          <SidebarInner
            pathname={pathname}
            collapsed={false}
            onToggle={toggle}
            onMobileClose={() => setMobileOpen(false)}
            isMobile
          />
        </aside>
      </TooltipProvider>
    </>
  );
}

function SidebarInner({
  pathname,
  collapsed,
  onToggle,
  onMobileClose,
  isMobile,
}: {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  isMobile: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border/60 px-3',
          collapsed ? 'justify-center' : 'justify-between gap-2 px-5',
        )}
      >
        <Link
          href="/dashboard"
          onClick={isMobile ? onMobileClose : undefined}
          className="flex items-center gap-2.5"
        >
          <BrandMark size={32} />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                Ibadah Admin
              </span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                Operations Console
              </span>
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onMobileClose}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col gap-5 overflow-y-auto p-3',
          collapsed && 'items-center',
        )}
      >
        <NavGroup
          label="Insight"
          items={INSIGHT}
          pathname={pathname}
          collapsed={collapsed}
          onItemClick={isMobile ? onMobileClose : undefined}
        />
        <NavGroup
          label="People"
          items={PEOPLE}
          pathname={pathname}
          collapsed={collapsed}
          onItemClick={isMobile ? onMobileClose : undefined}
        />
        <NavGroup
          label="Operate"
          items={OPERATE}
          pathname={pathname}
          collapsed={collapsed}
          onItemClick={isMobile ? onMobileClose : undefined}
        />
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={cn(
            'group mx-3 mb-3 flex h-9 items-center gap-2 rounded-lg border border-border/50 bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <>
              <ChevronLeft className="size-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      )}

      {!collapsed && (
        <div className="shrink-0 border-t border-border/60 p-4">
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Internal · v0.1
            </p>
            <p className="mt-1 text-xs text-foreground/80">Operate with care</p>
          </div>
        </div>
      )}
    </>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  collapsed,
  onItemClick,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  return (
    <div className={cn(collapsed && 'w-full')}>
      {!collapsed && (
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
          {label}
        </p>
      )}
      <nav className={cn('flex flex-col', collapsed ? 'items-center gap-1' : 'gap-1')}>
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const link = (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              onClick={onItemClick}
              className={cn(
                'group relative flex items-center rounded-xl text-sm font-medium transition-all',
                collapsed
                  ? 'size-10 justify-center'
                  : 'gap-3 px-3 py-2',
                active
                  ? 'bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {active && !collapsed && (
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
              {!collapsed && <span className="flex-1">{itemLabel}</span>}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{itemLabel}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>
    </div>
  );
}
