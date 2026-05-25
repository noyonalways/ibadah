import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export function Hero() {
  const t = useTranslations('Landing');

  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="bg-pattern absolute inset-0 opacity-40" aria-hidden />
      <div
        className="absolute inset-x-0 -top-40 -z-10 h-[500px] bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="container relative mx-auto flex flex-col items-center px-4 py-24 text-center md:py-32">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="size-3.5 text-accent" />
          {t('heroEyebrow')}
        </span>

        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
          {t('heroTitle')}
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
          {t('heroSubtitle')}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/register">
              {t('ctaPrimary')}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <a href="#features">{t('ctaSecondary')}</a>
          </Button>
        </div>

        {/* Decorative geometric divider */}
        <div className="mt-20 flex items-center gap-4 text-muted-foreground/50">
          <span className="h-px w-12 bg-current" />
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M12 2l2.39 4.84L20 8l-4.5 4.39L17 18l-5-2.84L7 18l1.5-5.61L4 8l5.61-1.16L12 2z" />
          </svg>
          <span className="h-px w-12 bg-current" />
        </div>
      </div>
    </section>
  );
}
