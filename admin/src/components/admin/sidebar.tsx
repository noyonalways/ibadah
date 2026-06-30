'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Activity,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
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
  /** i18n key under the `Nav` namespace. */
  labelKey: string;
  icon: LucideIcon;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

/**
 * Function-first grouping, ordered by how often an operator reaches for each:
 *
 *   - Insight     — read-only situational awareness (overview dashboard,
 *                    analytics, leaderboard).
 *   - People      — the consolidated Users page.
 *   - Operations  — privileged screens that change state or surface
 *                    observability (moderation, audit, system).
 *   - AI          — the assistant copilot and its provider configuration,
 *                    kept together since they're the same feature surface.
 *   - Account     — the operator's own settings, parked at the bottom.
 */
const SECTIONS: NavSection[] = [
  {
    labelKey: 'groupInsight',
    items: [
      { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
      { href: '/analytics', labelKey: 'analytics', icon: BarChart3 },
      { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
    ],
  },
  {
    labelKey: 'groupPeople',
    items: [{ href: '/users', labelKey: 'users', icon: Users }],
  },
  {
    labelKey: 'groupOperate',
    items: [
      { href: '/moderation', labelKey: 'moderation', icon: ShieldCheck },
      { href: '/audit', labelKey: 'audit', icon: FileText },
      { href: '/system', labelKey: 'system', icon: Activity },
    ],
  },
  {
    labelKey: 'groupAI',
    items: [
      { href: '/assistant', labelKey: 'assistant', icon: Sparkles },
      { href: '/ai-settings', labelKey: 'aiSettings', icon: Bot },
    ],
  },
  {
    labelKey: 'groupAccount',
    items: [{ href: '/settings', labelKey: 'settings', icon: Settings }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const tBrand = useTranslations('Brand');
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

  // Keyboard shortcut: Ctrl/Cmd + B toggles the desktop rail. Familiar
  // from VS Code / GitHub and avoids hunting for the chevron handle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        // Don't intercept while the user is typing into a field.
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label={t('closeMenu')}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <TooltipProvider delayDuration={250}>
        <aside
          className={cn(
            'group/sidebar sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur transition-[width] duration-200 ease-out lg:flex',
            collapsed ? 'w-[72px]' : 'w-64',
          )}
          aria-label={t('primary')}
        >
          <SidebarInner
            pathname={pathname}
            collapsed={collapsed}
            onToggle={toggle}
            onMobileClose={() => setMobileOpen(false)}
            isMobile={false}
            t={t}
            tBrand={tBrand}
          />

          {/* Floating edge handle — primary collapse affordance. Lives on
              the rail's right border so it's always within reach without
              eating space inside the nav. */}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={`${collapsed ? 'Expand' : 'Collapse'} sidebar  ⌘/Ctrl+B`}
            className={cn(
              'absolute -right-3 top-20 z-10 grid size-6 place-items-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition-all',
              'opacity-0 group-hover/sidebar:opacity-100 focus-visible:opacity-100 hover:scale-110 hover:bg-primary hover:text-primary-foreground hover:border-primary/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </button>
        </aside>

        {/* Off-canvas mobile drawer */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/60 bg-card shadow-2xl transition-transform duration-200 ease-out lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-hidden={!mobileOpen}
          aria-label={t('primary')}
        >
          <SidebarInner
            pathname={pathname}
            collapsed={false}
            onToggle={toggle}
            onMobileClose={() => setMobileOpen(false)}
            isMobile
            t={t}
            tBrand={tBrand}
          />
        </aside>
      </TooltipProvider>
    </>
  );
}

type Translator = (key: string) => string;

function SidebarInner({
  pathname,
  collapsed,
  onToggle,
  onMobileClose,
  isMobile,
  t,
  tBrand,
}: {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  isMobile: boolean;
  t: Translator;
  tBrand: Translator;
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
          aria-label="Go to dashboard"
        >
          <BrandMark size={32} />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                {tBrand('name')}
              </span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {tBrand('console')}
              </span>
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onMobileClose}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label={t('closeMenu')}
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
        {SECTIONS.map((section) => (
          <NavGroup
            key={section.labelKey}
            label={t(section.labelKey)}
            items={section.items}
            pathname={pathname}
            collapsed={collapsed}
            onItemClick={isMobile ? onMobileClose : undefined}
            t={t}
          />
        ))}
      </div>

      {!collapsed && (
        <div className="shrink-0 border-t border-border/60 p-4">
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {tBrand('internal')}
            </p>
            <p className="mt-1 text-xs text-foreground/80">{tBrand('tagline')}</p>
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
  t,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onItemClick?: () => void;
  t: Translator;
}) {
  return (
    <div className={cn(collapsed && 'w-full')}>
      {!collapsed && (
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
          {label}
        </p>
      )}
      <nav className={cn('flex flex-col', collapsed ? 'items-center gap-1' : 'gap-1')}>
        {items.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const itemLabel = t(labelKey);
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
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary to-accent rtl:left-auto rtl:right-0"
                  aria-hidden
                />
              )}
              {active && collapsed && (
                <span
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary to-accent"
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
