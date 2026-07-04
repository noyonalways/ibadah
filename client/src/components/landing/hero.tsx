import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/reveal';
import { HeroPreview } from '@/components/landing/hero-preview';
import { ProofBar } from '@/components/landing/proof-bar';

export function Hero() {
  const t = useTranslations('Landing');
  const tBrand = useTranslations('Brand');

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-40 h-64 w-64 rounded-full bg-accent/8 blur-3xl" aria-hidden />

      <div className="container relative mx-auto px-4 pb-4 pt-10 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="text-center lg:text-left">
            <Reveal variant="blur-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                {t('heroEyebrow')}
              </span>
            </Reveal>

            <Reveal variant="blur-up" delay={80}>
              <p
                className="font-display mt-6 text-[clamp(1.4rem,2.5vw,2rem)] leading-tight text-primary/70 dark:text-primary/80"
                dir="rtl"
                lang="ar"
              >
                {tBrand('bismillah_ar')}
              </p>
            </Reveal>

            <Reveal variant="blur-up" delay={140}>
              <h1 className="mt-3 text-balance text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-tight">
                <span className="block">{t('heroTitleLine1')}</span>
                <span className="block">
                  <span className="text-gradient">{t('heroTitleLine2a')}</span>{' '}
                  {t('heroTitleLine2b')}
                </span>
              </h1>
            </Reveal>

            <Reveal variant="blur-up" delay={200}>
              <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground lg:mx-0">
                {t('heroSubtitle')}
              </p>
            </Reveal>

            <Reveal variant="blur-up" delay={260}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep shadow-lg shadow-primary/25 hover:shadow-primary/40"
                >
                  <Link href="/register">
                    {t('ctaPrimary')}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="rounded-full">
                  <a href="#features">{t('ctaSecondary')}</a>
                </Button>
              </div>
            </Reveal>

            <Reveal variant="blur-up" delay={320}>
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border/50 pt-8 text-center lg:max-w-sm lg:text-left">
                <Stat label={t('stat_pillars')} value="5" />
                <Stat label={t('stat_languages')} value="3" />
                <Stat label={t('stat_builtFor')} value={t('stat_you')} />
              </div>
            </Reveal>
          </div>

          <Reveal variant="blur-up" delay={120} className="mx-auto w-full max-w-md lg:max-w-none">
            <HeroPreview />
          </Reveal>
        </div>

        <div className="mt-16 lg:mt-20">
          <ProofBar />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
