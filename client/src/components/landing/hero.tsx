import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { HeroPreview } from '@/components/landing/hero-preview';

export function Hero() {
  const t = useTranslations('Landing');
  const tBrand = useTranslations('Brand');

  return (
    <section className="relative isolate">
      <div className="container relative mx-auto grid items-center gap-16 px-4 pb-20 pt-20 md:pt-28 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
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
            {tBrand('bismillah_ar')}
          </p>

          <h1 className="mt-2 text-balance text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[1.05] tracking-tight">
            <span className="block">{t('heroTitleLine1')}</span>
            <span className="block">
              <span className="text-gradient">{t('heroTitleLine2a')}</span>{' '}
              {t('heroTitleLine2b')}
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
            <Stat label={t('stat_pillars')} value="5" />
            <Stat label={t('stat_languages')} value="3" />
            <Stat label={t('stat_builtFor')} value={t('stat_you')} />
          </div>
        </div>

        {/* Visual column — floating glass card. Shows the signed-in
            user's real "today" snapshot, or an evergreen demo for
            logged-out visitors. */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="animate-fade-up delay-150">
            <HeroPreview />
          </div>
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

