import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles, ShieldCheck, Lock, Layers, Globe, Compass } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/reveal';
import { HeroPreview } from '@/components/landing/hero-preview';
import { ScrollExpandContainer } from '@/components/landing/scroll-expand-container';
import { ProofBar } from '@/components/landing/proof-bar';

export function Hero() {
  const t = useTranslations('Landing');
  const tBrand = useTranslations('Brand');

  return (
    <section className="relative overflow-hidden pt-8 pb-14 lg:pt-14 lg:pb-20">
      {/* Subtle Minimal Ambient Background Accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/5 via-transparent to-transparent" aria-hidden />

      <div className="container relative mx-auto px-4">
        {/* Centered Hero Header Content */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow Pill */}
          <Reveal variant="blur-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3.5 py-1 text-xs font-medium text-foreground/80 backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              <Sparkles className="size-3 text-primary" />
              {t('heroEyebrow')}
            </span>
          </Reveal>

          {/* Arabic Bismillah Calligraphy */}
          <Reveal variant="blur-up" delay={80}>
            <p
              className="font-display mt-5 text-[clamp(1.2rem,2.2vw,1.6rem)] leading-normal text-primary/80 dark:text-primary/90 font-semibold"
              dir="rtl"
              lang="ar"
            >
              {tBrand('bismillah_ar')}
            </p>
          </Reveal>

          {/* Headline */}
          <Reveal variant="blur-up" delay={140}>
            <h1 className="mt-3 text-balance text-[clamp(1.8rem,3.8vw,3.2rem)] font-extrabold leading-[1.1] tracking-tight">
              <span className="block text-foreground">{t('heroTitleLine1')}</span>
              <span className="block mt-1">
                <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  {t('heroTitleLine2a')}
                </span>{' '}
                <span className="text-foreground">{t('heroTitleLine2b')}</span>
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal variant="blur-up" delay={200}>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              {t('heroSubtitle')}
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal variant="blur-up" delay={260}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group relative rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                <Link href="/register">
                  {t('ctaPrimary')}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-border/60 bg-background/80 px-6 backdrop-blur transition-colors hover:bg-muted/50"
              >
                <a href="#features">{t('ctaSecondary')}</a>
              </Button>
            </div>

            {/* Trust Badges Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="size-4 text-emerald-500" />
                {t('trust_private')}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Lock className="size-3.5 text-foreground/70" />
                {t('trust_no_ads')}
              </span>
            </div>
          </Reveal>
        </div>

        {/* Centered Showcase Frame with Minimal Scroll-Driven Frame Growth */}
        <Reveal variant="blur-up" delay={120} className="relative mt-10 md:mt-14 mx-auto w-full max-w-5xl xl:max-w-6xl">
          <ScrollExpandContainer>
            <HeroPreview />
          </ScrollExpandContainer>
        </Reveal>

        {/* Centered Stats Minimal Micro-Cards */}
        <Reveal variant="blur-up" delay={320}>
          <div className="mt-12 mx-auto max-w-2xl grid grid-cols-3 gap-3 md:gap-4 text-center">
            <StatCard
              icon={<Compass className="size-4 text-primary" />}
              value="5"
              label={t('stat_pillars')}
            />
            <StatCard
              icon={<Globe className="size-4 text-emerald-500" />}
              value="3"
              label={t('stat_languages')}
            />
            <StatCard
              icon={<Layers className="size-4 text-amber-500" />}
              value={t('stat_privacy_val')}
              label={t('stat_privacy_guarantee')}
            />
          </div>
        </Reveal>

        {/* Proof Bar */}
        <div className="mt-16 lg:mt-20">
          <ProofBar />
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-colors hover:border-border/80">
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span className="text-base font-bold tracking-tight text-foreground">{value}</span>
      </div>
      <div className="mt-1 text-[10px] uppercase font-medium tracking-wider text-muted-foreground truncate">
        {label}
      </div>
    </div>
  );
}
