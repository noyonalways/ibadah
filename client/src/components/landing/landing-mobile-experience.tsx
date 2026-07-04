'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  HandHeart,
  Heart,
  Home,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogIn,
  LogOut,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { BrandMark } from '@/components/shared/brand-mark';
import { HeroPreview } from '@/components/landing/hero-preview';
import { FAQ } from '@/components/landing/faq';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LandingOnboarding } from '@/components/landing/landing-onboarding';
import {
  LANDING_ONBOARDING_KEY,
  loadOnboardingPrefs,
  type OnboardingFocus,
  type OnboardingPreferences,
} from '@/components/landing/landing-onboarding-prefs';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'explore' | 'account';

const ALL_FOCUS: OnboardingFocus[] = ['salah', 'quran', 'dhikr', 'habits', 'checklist'];
const FEATURE_KEYS = [...ALL_FOCUS, 'visuals'] as const;
const FEATURE_ICONS: Record<(typeof FEATURE_KEYS)[number], LucideIcon> = {
  salah: CheckCircle2,
  quran: BookOpen,
  dhikr: HandHeart,
  habits: ListChecks,
  checklist: Sparkles,
  visuals: LineChart,
};

const HOW_STEPS = [
  { icon: Compass, titleKey: 'how_step1_title', descKey: 'how_step1_desc' },
  { icon: Heart, titleKey: 'how_step2_title', descKey: 'how_step2_desc' },
  { icon: LineChart, titleKey: 'how_step3_title', descKey: 'how_step3_desc' },
] as const;

/**
 * Mobile-first landing shell — tab bar, onboarding, and compact app-style
 * surfaces. Hidden on lg+ where the full marketing page is shown instead.
 */
export function LandingMobileExperience() {
  const t = useTranslations('Landing');
  const tBrand = useTranslations('Brand');
  const { user, hasHydrated } = useCurrentUser();
  const isAuthed = hasHydrated && !!user;

  const [tab, setTab] = useState<Tab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prefs, setPrefs] = useState<OnboardingPreferences | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    setPrefs(loadOnboardingPrefs());
    if (isAuthed) return;
    try {
      if (!localStorage.getItem(LANDING_ONBOARDING_KEY)) {
        setShowOnboarding(true);
      }
    } catch {
      // localStorage may be unavailable in private mode
    }
  }, [hasHydrated, isAuthed]);

  const completeOnboarding = () => {
    try {
      localStorage.setItem(LANDING_ONBOARDING_KEY, '1');
    } catch {
      // ignore
    }
    setPrefs(loadOnboardingPrefs());
    setShowOnboarding(false);
  };

  return (
    <div className="w-full overflow-x-hidden lg:hidden">
      {showOnboarding && <LandingOnboarding onComplete={completeOnboarding} />}

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <BrandMark size={28} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t('mobile_greeting')}
            </p>
            <p className="truncate text-base font-semibold tracking-tight">
              {isAuthed ? user?.name ?? tBrand('name') : tBrand('name')}
            </p>
          </div>
        </div>
      </header>

      <main
        className={cn(
          'min-w-0 overflow-x-hidden px-4 pt-4',
          tab === 'home' && !isAuthed
            ? 'pb-[calc(9.5rem+env(safe-area-inset-bottom))]'
            : 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]',
        )}
      >
        {tab === 'home' && <MobileHomeTab isAuthed={isAuthed} prefs={prefs} />}
        {tab === 'explore' && <MobileExploreTab />}
        {tab === 'account' && <MobileAccountTab isAuthed={isAuthed} user={user} />}
      </main>

      {tab === 'home' && !isAuthed && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
          <Button
            asChild
            size="lg"
            className="group w-full rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep shadow-lg shadow-primary/25"
          >
            <Link href="/register">
              {t('ctaPrimary')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
          <TabButton
            active={tab === 'home'}
            onClick={() => setTab('home')}
            icon={Home}
            label={t('mobile_tab_home')}
          />
          <TabButton
            active={tab === 'explore'}
            onClick={() => setTab('explore')}
            icon={Sparkles}
            label={t('mobile_tab_explore')}
          />
          <TabButton
            active={tab === 'account'}
            onClick={() => setTab('account')}
            icon={User}
            label={t('mobile_tab_account')}
          />
        </div>
      </nav>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:scale-[0.98]',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-7 w-12 place-items-center rounded-full transition-colors',
          active && 'bg-primary/15',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className={cn('text-[10px] font-medium tracking-tight', active && 'font-semibold')}>
        {label}
      </span>
    </button>
  );
}

function MobileHomeTab({
  isAuthed,
  prefs,
}: {
  isAuthed: boolean;
  prefs: OnboardingPreferences | null;
}) {
  const t = useTranslations('Landing');
  const tBrand = useTranslations('Brand');

  const focusOrder: OnboardingFocus[] = prefs
    ? [...prefs.focus, ...ALL_FOCUS.filter((k) => !prefs.focus.includes(k))]
    : ALL_FOCUS;

  const personaMessage = prefs ? t(`onboarding_home_${prefs.persona}`) : null;

  return (
    <div className="min-w-0 space-y-6">
      {personaMessage && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground/90">{personaMessage}</p>
        </section>
      )}

      <section className="min-w-0 overflow-hidden">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t('mobile_todaySnapshot')}
        </p>
        <HeroPreview />
      </section>

      {isAuthed ? (
        <Button
          asChild
          size="lg"
          className="w-full rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep shadow-lg shadow-primary/25"
        >
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            {t('mobile_openDashboard')}
          </Link>
        </Button>
      ) : (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {t('heroSubtitle')}
        </p>
      )}

      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t('mobile_quickStats')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard value="5" label={t('stat_pillars')} />
          <StatCard value="3" label={t('stat_languages')} />
          <StatCard value={t('stat_you')} label={t('stat_builtFor')} />
        </div>
      </section>

      <section className="min-w-0 overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {prefs ? t('mobile_yourFocus') : t('mobile_quickActions')}
          </p>
        </div>
        <div className="-mx-4 overflow-hidden px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {focusOrder.map((key) => {
            const Icon = FEATURE_ICONS[key];
            const isPinned = prefs?.focus.includes(key);
            return (
              <div
                key={key}
                className={cn(
                  'flex w-[7.5rem] shrink-0 flex-col gap-2 rounded-2xl border p-3 backdrop-blur',
                  isPinned
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/60 bg-card/70',
                )}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-medium leading-tight">{t(`feature_${key}_title`)}</span>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 text-center backdrop-blur">
        <p
          className="font-display text-lg leading-relaxed text-primary/80"
          dir="rtl"
          lang="ar"
        >
          {tBrand('bismillah_ar')}
        </p>
        <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
          &ldquo;{t('verse_main')}&rdquo;
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
          {t('verse_main_cite')}
        </p>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 px-3 py-4 text-center backdrop-blur">
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  );
}

function MobileExploreTab() {
  const t = useTranslations('Landing');

  return (
    <div className="min-w-0 space-y-8">
      <section>
        <h2 className="text-lg font-semibold tracking-tight">{t('how_eyebrow')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('how_subtitle')}</p>
        <ul className="mt-4 space-y-3">
          {HOW_STEPS.map(({ icon: Icon, titleKey, descKey }, i) => (
            <li
              key={titleKey}
              className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-0.5 font-medium">{t(titleKey)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">{t('features_eyebrow')}</h2>
        <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
          {FEATURE_KEYS.map((key) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <li key={key}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t(`feature_${key}_title`)}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {t(`feature_${key}_desc`)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full">
          <Link href="/features">
            {t('mobile_seeAllFeatures')}
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">{t('faq_title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('faq_subtitle')}</p>
        <div className="mt-4">
          <FAQ compact />
        </div>
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full rounded-full">
          <Link href="/faq">{t('mobile_seeAllFaq')}</Link>
        </Button>
      </section>
    </div>
  );
}

function MobileAccountTab({
  isAuthed,
  user,
}: {
  isAuthed: boolean;
  user: { name?: string; email?: string; avatarUrl?: string } | null | undefined;
}) {
  const t = useTranslations('Landing');
  const tNav = useTranslations('Nav');
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const LINKS = [
    { href: '/about', label: t('footer_about') },
    { href: '/privacy', label: t('footer_privacy') },
    { href: '/terms', label: t('footer_terms') },
  ] as const;

  return (
    <div className="min-w-0 space-y-6">
      {isAuthed ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
          <Avatar src={user?.avatarUrl} name={user?.name} size={48} rounded="2xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('mobile_accountPrompt')}</p>
          <Button
            asChild
            size="lg"
            className="w-full rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep"
          >
            <Link href="/register">{t('ctaPrimary')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-full">
            <Link href="/login">
              <LogIn className="size-4" />
              {tNav('login')}
            </Link>
          </Button>
        </div>
      )}

      {isAuthed && (
        <div className="space-y-2">
          <Button asChild className="w-full rounded-full" size="lg">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              {tNav('dashboard')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full" size="lg">
            <Link href="/settings">{tNav('settings')}</Link>
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {tNav('preferences')}
        </p>
        <div className="flex items-center justify-between gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </section>

      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors active:bg-muted/60"
            >
              {label}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {isAuthed && (
        <Button
          variant="outline"
          className="w-full rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          {tNav('logout')}
        </Button>
      )}

      <p className="pb-2 text-center text-xs text-muted-foreground">{t('footer_madeWith')}</p>
    </div>
  );
}
