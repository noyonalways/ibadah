import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { Reveal } from '@/components/shared/reveal';
import { LandingSection } from '@/components/landing/landing-section';

export function CTA() {
  const t = useTranslations('Landing');

  return (
    <LandingSection>
      <Reveal variant="scale-in">
        <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-deep to-tertiary p-10 text-primary-foreground shadow-2xl shadow-primary/25 md:p-14">
          <GeometricPattern className="text-white" opacity={0.08} />
          <div
            className="absolute -bottom-32 -right-20 size-[420px] rounded-full bg-accent/40 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -left-20 -top-32 size-[360px] rounded-full bg-tertiary/40 blur-3xl"
            aria-hidden
          />

          <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <Reveal variant="blur-up" delay={80}>
                <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                  {t('cta_eyebrow')}
                </p>
              </Reveal>
              <Reveal variant="blur-up" delay={140}>
                <h3 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                  {t('cta_title_1')}
                  <br />
                  {t('cta_title_2')}
                </h3>
              </Reveal>
              <Reveal variant="blur-up" delay={200}>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
                  {t('cta_subtitle')}
                </p>
              </Reveal>
            </div>

            <Reveal variant="blur-up" delay={260} className="flex flex-col gap-3 md:items-end">
              <Button
                asChild
                size="lg"
                className="group rounded-full bg-white px-8 text-primary shadow-xl hover:bg-white/95"
              >
                <Link href="/register">
                  {t('cta_primary')}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="rounded-full text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link href="/login">{t('cta_secondary')}</Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </Reveal>
    </LandingSection>
  );
}
