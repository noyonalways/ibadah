import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { GlowOrbs } from '@/components/shared/glow-orbs';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { ProgressRing } from '@/components/shared/progress-ring';

export function Hero() {
  const t = useTranslations('Landing');

  return (
    <section className="relative isolate overflow-hidden">
      {/* Layered backdrop */}
      <GlowOrbs />
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <GeometricPattern className="text-primary" opacity={0.06} />

      <div className="container relative mx-auto grid items-center gap-16 px-4 pb-24 pt-20 md:pt-28 lg:grid-cols-[1.1fr_1fr] lg:pb-32">
        {/* Copy column */}
        <div className="animate-fade-up text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-accent" />
            {t('heroEyebrow')}
          </span>

          {/* Arabic decorative phrase */}
          <p
            className="font-display mt-7 text-[clamp(1.5rem,3.5vw,2.4rem)] leading-tight text-primary/70 dark:text-primary/80"
            dir="rtl"
            lang="ar"
          >
            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>

          <h1 className="mt-2 text-balance text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[1.05] tracking-tight">
            <span className="block">Track your worship.</span>
            <span className="block">
              <span className="text-gradient">Strengthen</span> your journey.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg lg:mx-0">
            {t('heroSubtitle')}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button
              asChild
              size="lg"
              className="group rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep px-7 shadow-xl shadow-primary/25 hover:shadow-primary/40"
            >
              <Link href="/register">
                {t('ctaPrimary')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full">
              <a href="#features">{t('ctaSecondary')}</a>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/50 pt-6 text-center lg:max-w-md lg:text-left">
            <Stat label="Pillars tracked" value="5" />
            <Stat label="Languages" value="3" />
            <Stat label="Built for" value="You" />
          </div>
        </div>

        {/* Visual column — floating glass card with rings */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up delay-150 lg:max-w-none">
          <FloatingPreview />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight md:text-3xl">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/**
 * The "wow" preview — a floating glass card showing what the app actually
 * looks like in use: progress rings, today's prayers, a streak.
 */
function FloatingPreview() {
  return (
    <div className="relative">
      {/* Decorative glow */}
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/30 via-tertiary/15 to-accent/30 blur-3xl" />

      {/* Halo ring */}
      <div
        className="absolute -inset-1 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/40 via-transparent to-accent/40 opacity-60 blur-2xl animate-breathe-slow"
        aria-hidden
      />

      <div className="glass-card relative overflow-hidden rounded-[1.75rem] p-6 md:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Today
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">Friday, Rabi&apos; al-Awwal</p>
          </div>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
            +85 pts
          </span>
        </div>

        {/* Rings cluster */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <ProgressRing
            value={82}
            max={100}
            size={150}
            thickness={11}
            label="82%"
            sublabel="Overall"
          />
        </div>

        {/* Mini prayer chips */}
        <div className="mt-6 grid grid-cols-5 gap-1.5">
          {[
            { name: 'Fajr', tone: 'bg-prayer-fajr' },
            { name: 'Dhuhr', tone: 'bg-prayer-dhuhr' },
            { name: 'Asr', tone: 'bg-prayer-asr' },
            { name: 'Maghrib', tone: 'bg-prayer-maghrib' },
            { name: 'Isha', tone: 'bg-prayer-isha' },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg ${p.tone} p-2 text-[10px] font-medium text-white/95`}
            >
              <span className="absolute inset-x-0 bottom-1.5 text-center tracking-wide">
                {p.name}
              </span>
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-white/80" />
            </div>
          ))}
        </div>

        {/* Streak strip */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-deep text-accent-foreground shadow-sm">
              <span className="text-sm font-bold">14</span>
            </span>
            <div>
              <p className="text-sm font-medium leading-none">Day streak</p>
              <p className="mt-1 text-xs text-muted-foreground">Keep it alive ✨</p>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className={`h-6 w-1.5 rounded-full ${i < 5 ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
