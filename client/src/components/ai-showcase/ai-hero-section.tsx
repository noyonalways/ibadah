'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, Bot, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/reveal';
import { GlowOrbs } from '@/components/shared/glow-orbs';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

export function AiHeroSection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      <GlowOrbs />
      <GeometricPattern className="opacity-40" />

      <div className="container relative mx-auto px-4 text-center">
        {/* Top Badge */}
        <Reveal variant="blur-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
            <Sparkles className="size-3.5 text-accent animate-pulse" />
            <span>{t('AiShowcase.badge')}</span>
          </div>
        </Reveal>

        {/* Main Hero Header */}
        <Reveal variant="fade-up" delay={100}>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t('AiShowcase.title_line1')}{' '}
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-accent-deep bg-clip-text text-transparent">
              {t('AiShowcase.title_line2')}
            </span>
          </h1>
        </Reveal>

        {/* Subtitle */}
        <Reveal variant="fade-up" delay={200}>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('AiShowcase.subtitle')}
          </p>
        </Reveal>

        {/* Action Buttons */}
        <Reveal variant="fade-up" delay={300}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-primary to-accent-deep px-7 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40"
            >
              <a href="#sandbox">
                <Bot className="mr-2 size-4" />
                {t('AiShowcase.cta_try_demo')}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-border/80 px-7 font-semibold transition-colors hover:bg-muted"
            >
              <Link href="/register">
                {t('AiShowcase.cta_explore_app')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {/* Highlight Stats Bar */}
        <Reveal variant="fade-up" delay={400}>
          <div className="mx-auto mt-14 max-w-4xl rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-xl sm:p-6 shadow-xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              <div className="flex flex-col items-center pt-2 sm:pt-0">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="size-5" />
                  <span className="text-sm font-semibold">{t('AiShowcase.stats_verified_sources')}</span>
                </div>
                <span className="mt-1 text-base font-bold text-foreground">
                  {t('AiShowcase.stats_verified_val')}
                </span>
              </div>

              <div className="flex flex-col items-center pt-4 sm:pt-0">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="size-5" />
                  <span className="text-sm font-semibold">{t('AiShowcase.stats_response_time')}</span>
                </div>
                <span className="mt-1 text-base font-bold text-foreground">
                  {t('AiShowcase.stats_response_val')}
                </span>
              </div>

              <div className="flex flex-col items-center pt-4 sm:pt-0">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="size-5" />
                  <span className="text-sm font-semibold">{t('AiShowcase.stats_scholar_review')}</span>
                </div>
                <span className="mt-1 text-base font-bold text-foreground">
                  {t('AiShowcase.stats_scholar_val')}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
