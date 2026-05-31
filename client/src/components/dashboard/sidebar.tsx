'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  ScrollText,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
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
  href:
    | '/dashboard'
    | '/salah'
    | '/quran'
    | '/hadith'
    | '/dhikr'
    | '/habits'
    | '/checklist'
    | '/assistant'
    | '/settings';
  labelKey: string;
  icon: LucideIcon;
}

const PRIMARY: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard },
  { href: '/salah', labelKey: 'Nav.salah', icon: CheckCircle2 },
  { href: '/quran', labelKey: 'Nav.quran', icon: BookOpen },
  { href: '/hadith', labelKey: 'Nav.hadith', icon: ScrollText },
  { href: '/dhikr', labelKey: 'Nav.dhikr', icon: HandHeart },
  { href: '/habits', labelKey: 'Nav.habits', icon: ListChecks },
  { href: '/checklist', labelKey: 'Nav.checklist', icon: ListTodo },
];

const SECONDARY: NavItem[] = [
  { href: '/assistant', labelKey: 'Nav.assistant', icon: Sparkles },
  { href: '/settings', labelKey: 'Nav.settings', icon: Settings },
];

export function DashboardSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  // ⌘/Ctrl+B toggles the rail. Skipped while typing into a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
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
    <TooltipProvider delayDuration={250}>
      <aside
        className={cn(
          'group/sidebar sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
        aria-label={t('Nav.tracking')}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-border/60',
            collapsed ? 'justify-center px-3' : 'gap-2.5 px-5',
          )}
        >
          <BrandMark size={32} />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                {t('Brand.name')}
              </span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {t('Brand.tagline')}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex flex-1 flex-col gap-6 overflow-y-auto p-3',
            collapsed && 'items-center',
          )}
        >
          <NavGroup
            labelKey="Nav.tracking"
            items={PRIMARY}
            pathname={pathname}
            t={t}
            collapsed={collapsed}
          />
          <NavGroup
            labelKey="Nav.account"
            items={SECONDARY}
            pathname={pathname}
            t={t}
            collapsed={collapsed}
          />
        </div>

        {/* In-rail toggle */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={`${collapsed ? 'Expand' : 'Collapse'}  ⌘/Ctrl+B`}
          className={cn(
            'mx-3 mb-3 flex h-9 items-center gap-2 rounded-lg border border-border/50 bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <>
              <ChevronLeft className="size-3.5" />
              <span>Collapse</span>
              <kbd className="ml-auto rounded border border-border/60 bg-muted/40 px-1 py-px font-mono text-[10px] tracking-tight text-muted-foreground/80">
                ⌘B
              </kbd>
            </>
          )}
        </button>

        {/* Subtle inspirational footer (only when expanded) */}
        {!collapsed && (
          <div className="shrink-0 border-t border-border/60 p-4">
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 text-center">
              <p
                className="font-display text-sm leading-relaxed text-foreground/80"
                dir="rtl"
                lang="ar"
              >
                {t('Brand.alhamdulillah_ar')}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('Brand.alhamdulillah')}
              </p>
            </div>
          </div>
        )}

        {/* Floating edge handle — primary collapse affordance. Lives on
            the rail's right border so it's always within reach. */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={`${collapsed ? 'Expand' : 'Collapse'}  ⌘/Ctrl+B`}
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
    </TooltipProvider>
  );
}

function NavGroup({
  labelKey,
  items,
  pathname,
  t,
  collapsed,
}: {
  labelKey: string;
  items: NavItem[];
  pathname: string;
  t: (key: string) => string;
  collapsed: boolean;
}) {
  return (
    <div className={cn(collapsed && 'w-full')}>
      {!collapsed && (
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
          {t(labelKey)}
        </p>
      )}
      <nav className={cn('flex flex-col', collapsed ? 'items-center gap-1' : 'gap-1')}>
        {items.map(({ href, labelKey: itemLabelKey, icon: Icon }) => {
          const active = pathname === href;
          const link = (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center rounded-xl text-sm font-medium transition-all',
                collapsed ? 'size-10 justify-center' : 'gap-3 px-3 py-2',
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
              {!collapsed && <span className="flex-1">{t(itemLabelKey)}</span>}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{t(itemLabelKey)}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>
    </div>
  );
}
