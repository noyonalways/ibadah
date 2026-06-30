import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';

import { Link, type AppLocale } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import { buildBreadcrumbJsonLd, buildPublicPageMetadata } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Footer } from '@/components/landing/footer';
import { Features } from '@/components/landing/features';
import { Pillars } from '@/components/landing/pillars';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Reveal } from '@/components/shared/reveal';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'FeaturesPage' });
  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'feature',
    title: t('metaTitle'),
    description: t('metaDescription'),
    eyebrow: t('eyebrow'),
  });

  return buildPublicPageMetadata({
    locale,
    path: '/features',
    title: t('metaTitle'),
    description: t('metaDescription'),
    ogImage,
    keywords: [
      'Salah tracker',
      'Quran tracker',
      'Dhikr counter app',
      'Islamic habit tracker',
      'Muslim checklist app',
      'Worship heatmap',
    ],
  });
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'FeaturesPage' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const tNav = await getTranslations({ locale, namespace: 'Nav' });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: tBrand('name'), path: '' },
    { name: tNav('features'), path: '/features' },
  ]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <MarketingBackdrop />
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="relative flex-1">
        <section className="relative isolate">
          <div className="container mx-auto px-4 pt-16 pb-8 md:pt-24 md:pb-12">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                  {t('eyebrow')}
                </span>
              </Reveal>
              <Reveal delay={140}>
                <h1 className="mt-5 text-balance text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[1.05] tracking-tight">
                  {t('title')}
                </h1>
              </Reveal>
              <Reveal delay={220}>
                <p className="mt-5 text-pretty text-base text-muted-foreground md:text-lg">
                  {t('lead')}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <Pillars />
        <HowItWorks />
        <Features />

        <section className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-deep to-tertiary p-10 text-primary-foreground shadow-2xl shadow-primary/30 md:p-14">
                <GeometricPattern className="text-white" opacity={0.08} />
                <div
                  className="absolute -bottom-32 -right-20 size-[420px] rounded-full bg-accent/40 blur-3xl"
                  aria-hidden
                />
                <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                  <div>
                    <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight md:text-4xl">
                      {t('cta_title')}
                    </h2>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-primary-foreground/85">
                      {t('cta_subtitle')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <Button
                      asChild
                      size="lg"
                      className="group rounded-full bg-white px-8 text-primary hover:bg-white/95"
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
                      <Link href="/faq">{t('cta_secondary')}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
