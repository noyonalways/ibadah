'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  HandHeart,
  ListChecks,
  Sparkles,
  Sprout,
  Sun,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/shared/brand-mark';
import { GlowOrbs } from '@/components/shared/glow-orbs';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import {
  type OnboardingFocus,
  type OnboardingPersona,
  type OnboardingPreferences,
  saveOnboardingPrefs,
} from '@/components/landing/landing-onboarding-prefs';
import { cn } from '@/lib/utils';

export { LANDING_ONBOARDING_KEY } from '@/components/landing/landing-onboarding-prefs';

type Step = 'welcome' | 'persona' | 'focus' | 'preview' | 'finish';
const STEPS: Step[] = ['welcome', 'persona', 'focus', 'preview', 'finish'];

const PERSONAS: {
  id: OnboardingPersona;
  icon: LucideIcon;
  labelKey: string;
  titleKey: string;
  descKey: string;
}[] = [
  {
    id: 'beginner',
    icon: Sprout,
    labelKey: 'persona_beginner_label',
    titleKey: 'persona_beginner_title',
    descKey: 'persona_beginner_desc',
  },
  {
    id: 'consistent',
    icon: Sun,
    labelKey: 'persona_consistent_label',
    titleKey: 'persona_consistent_title',
    descKey: 'persona_consistent_desc',
  },
  {
    id: 'returning',
    icon: Undo2,
    labelKey: 'persona_returning_label',
    titleKey: 'persona_returning_title',
    descKey: 'persona_returning_desc',
  },
];

const FOCUS_OPTIONS: { id: OnboardingFocus; icon: LucideIcon }[] = [
  { id: 'salah', icon: CheckCircle2 },
  { id: 'quran', icon: BookOpen },
  { id: 'dhikr', icon: HandHeart },
  { id: 'habits', icon: ListChecks },
  { id: 'checklist', icon: Sparkles },
];

export function LandingOnboarding({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('Landing');
  const tBrand = useTranslations('Brand');

  const [step, setStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [persona, setPersona] = useState<OnboardingPersona | null>(null);
  const [focus, setFocus] = useState<OnboardingFocus[]>(['salah']);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goTo = (next: Step, dir: 'forward' | 'back') => {
    setDirection(dir);
    setStep(next);
  };

  const goNext = () => {
    const i = stepIndex;
    if (i < STEPS.length - 1) goTo(STEPS[i + 1], 'forward');
  };

  const goBack = () => {
    const i = stepIndex;
    if (i > 0) goTo(STEPS[i - 1], 'back');
  };

  const toggleFocus = (id: OnboardingFocus) => {
    setFocus((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((f) => f !== id) : prev) : [...prev, id],
    );
  };

  const persistAndComplete = (prefs: OnboardingPreferences) => {
    saveOnboardingPrefs(prefs);
    onComplete();
  };

  const handleSkip = () => {
    persistAndComplete({
      persona: persona ?? 'beginner',
      focus: focus.length > 0 ? focus : ['salah'],
    });
  };

  const handleFinishExplore = () => {
    if (!persona) return;
    persistAndComplete({ persona, focus });
  };

  const canAdvance =
    step === 'welcome' ||
    (step === 'persona' && persona !== null) ||
    (step === 'focus' && focus.length > 0) ||
    step === 'preview';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding_title')}
    >
      {/* Immersive backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <GlowOrbs variant="aurora" />
        <GeometricPattern className="text-primary" opacity={0.06} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      {/* Progress */}
      {step !== 'welcome' && (
        <div className="relative z-10 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors active:bg-muted/60"
              aria-label={t('onboarding_back')}
            >
              <ArrowLeft className="size-5" />
            </button>
            <span className="text-xs font-medium text-muted-foreground">
              {t('onboarding_stepOf', { current: stepIndex + 1, total: STEPS.length })}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              className="px-2 py-1 text-xs font-medium text-muted-foreground transition-colors active:text-foreground"
            >
              {t('onboarding_skip')}
            </button>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent-deep transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          key={step}
          className={cn(
            'flex min-h-0 flex-1 flex-col px-6 animate-in duration-300 fill-mode-both',
            direction === 'forward'
              ? 'fade-in slide-in-from-right-6'
              : 'fade-in slide-in-from-left-6',
          )}
        >
          {step === 'welcome' && (
            <WelcomeStep
              bismillah={tBrand('bismillah_ar')}
              tagline={tBrand('tagline')}
              title={t('onboarding_welcome_title')}
              subtitle={t('onboarding_welcome_desc')}
            />
          )}

          {step === 'persona' && (
            <PersonaStep
              title={t('onboarding_persona_title')}
              subtitle={t('onboarding_persona_subtitle')}
              personas={PERSONAS.map((p) => ({
                ...p,
                label: t(p.labelKey),
                title: t(p.titleKey),
                desc: t(p.descKey),
              }))}
              selected={persona}
              onSelect={setPersona}
            />
          )}

          {step === 'focus' && (
            <FocusStep
              title={t('onboarding_focus_title')}
              subtitle={t('onboarding_focus_subtitle')}
              options={FOCUS_OPTIONS.map((o) => ({
                ...o,
                label: t(`feature_${o.id}_title`),
              }))}
              selected={focus}
              onToggle={toggleFocus}
              selectedLabel={t('onboarding_focus_selected', { count: focus.length })}
            />
          )}

          {step === 'preview' && persona && (
            <PreviewStep
              title={t('onboarding_preview_title')}
              subtitle={t(`onboarding_ready_${persona}`)}
              mockLabel={t('onboarding_preview_mock')}
              focus={focus}
              focusLabels={
                Object.fromEntries(
                  FOCUS_OPTIONS.map((o) => [o.id, t(`feature_${o.id}_title`)]),
                ) as Record<OnboardingFocus, string>
              }
              icons={
                Object.fromEntries(FOCUS_OPTIONS.map((o) => [o.id, o.icon])) as Record<
                  OnboardingFocus,
                  LucideIcon
                >
              }
            />
          )}

          {step === 'finish' && persona && (
            <FinishStep
              title={t('onboarding_finish_title')}
              subtitle={t(`onboarding_finish_${persona}`)}
              badge={t('onboarding_finish_badge', { count: focus.length })}
            />
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="relative z-10 shrink-0 space-y-3 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        {step === 'welcome' && (
          <>
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary via-primary to-accent-deep text-base shadow-xl shadow-primary/25 active:scale-[0.98]"
              onClick={goNext}
            >
              {t('onboarding_begin')}
              <ArrowRight className="size-5" />
            </Button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 text-center text-sm text-muted-foreground active:text-foreground"
            >
              {t('onboarding_exploreFirst')}
            </button>
          </>
        )}

        {step === 'finish' ? (
          <>
            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary via-primary to-accent-deep text-base shadow-xl shadow-primary/25 active:scale-[0.98]"
            >
              <Link href="/register" onClick={handleFinishExplore}>
                {t('onboarding_createAccount')}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-2xl active:scale-[0.98]"
              onClick={handleFinishExplore}
            >
              {t('onboarding_exploreFirst')}
            </Button>
          </>
        ) : (
          step !== 'welcome' && (
            <Button
              size="lg"
              disabled={!canAdvance}
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary via-primary to-accent-deep text-base shadow-xl shadow-primary/25 active:scale-[0.98] disabled:opacity-40"
              onClick={() => {
                if (step === 'preview') goTo('finish', 'forward');
                else goNext();
              }}
            >
              {step === 'preview' ? t('onboarding_almostThere') : t('onboarding_next')}
              <ArrowRight className="size-5" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

function WelcomeStep({
  bismillah,
  tagline,
  title,
  subtitle,
}: {
  bismillah: string;
  tagline: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
      <div className="mb-10 animate-fade-up">
        <BrandMark size={80} animate className="mx-auto shadow-2xl shadow-primary/20" />
      </div>
      <p
        className="font-display animate-fade-up text-xl leading-relaxed text-primary/80 delay-75"
        dir="rtl"
        lang="ar"
      >
        {bismillah}
      </p>
      <p className="mt-3 animate-fade-up text-[10px] uppercase tracking-[0.28em] text-muted-foreground delay-100">
        {tagline}
      </p>
      <h1 className="mt-8 animate-fade-up text-balance text-3xl font-bold tracking-tight delay-150">
        {title}
      </h1>
      <p className="mt-4 max-w-xs animate-fade-up text-balance text-sm leading-relaxed text-muted-foreground delay-200">
        {subtitle}
      </p>
    </div>
  );
}

function PersonaStep({
  title,
  subtitle,
  personas,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  personas: {
    id: OnboardingPersona;
    icon: LucideIcon;
    label: string;
    title: string;
    desc: string;
  }[];
  selected: OnboardingPersona | null;
  onSelect: (id: OnboardingPersona) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-4">
      <StepHeader title={title} subtitle={subtitle} />
      <ul className="mt-6 flex-1 space-y-3 overflow-y-auto pb-4">
        {personas.map(({ id, icon: Icon, label, title: cardTitle, desc }) => {
          const active = selected === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  'flex w-full gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.98]',
                  active
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/30'
                    : 'border-border/60 bg-card/70 backdrop-blur',
                )}
              >
                <span
                  className={cn(
                    'grid size-12 shrink-0 place-items-center rounded-xl transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 font-semibold">{cardTitle}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
                {active && (
                  <span className="grid size-6 shrink-0 place-items-center self-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FocusStep({
  title,
  subtitle,
  options,
  selected,
  onToggle,
  selectedLabel,
}: {
  title: string;
  subtitle: string;
  options: { id: OnboardingFocus; icon: LucideIcon; label: string }[];
  selected: OnboardingFocus[];
  onToggle: (id: OnboardingFocus) => void;
  selectedLabel: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-4">
      <StepHeader title={title} subtitle={subtitle} />
      <div className="mt-6 grid grid-cols-2 gap-3 pb-4">
        {options.map(({ id, icon: Icon, label }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                'relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.97]',
                active
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10 ring-2 ring-primary/25'
                  : 'border-border/60 bg-card/70 backdrop-blur',
              )}
            >
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-xl',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{label}</span>
              {active && (
                <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">{selectedLabel}</p>
    </div>
  );
}

function PreviewStep({
  title,
  subtitle,
  mockLabel,
  focus,
  focusLabels,
  icons,
}: {
  title: string;
  subtitle: string;
  mockLabel: string;
  focus: OnboardingFocus[];
  focusLabels: Record<OnboardingFocus, string>;
  icons: Record<OnboardingFocus, LucideIcon>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-4">
      <StepHeader title={title} subtitle={subtitle} />
      <div className="mt-8 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-xl shadow-primary/5 backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {mockLabel}
          </p>
          <ul className="mt-4 space-y-2">
            {focus.map((id, i) => {
              const Icon = icons[id];
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-xl bg-background/80 px-3 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{focusLabels[id]}</span>
                  <Check className="size-4 text-primary" />
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinishStep({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-4 text-center">
      <div className="mb-8 grid size-24 place-items-center rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/15 to-tertiary/20 shadow-xl">
        <Check className="size-12 text-primary" strokeWidth={2} />
      </div>
      <h2 className="text-balance text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-xs text-balance text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
      <p className="mt-6 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground">
        {badge}
      </p>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-balance text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}
