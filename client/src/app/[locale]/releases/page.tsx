import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { type AppLocale } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import { buildBreadcrumbJsonLd, buildPublicPageMetadata } from '@/lib/seo';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Footer } from '@/components/landing/footer';
import { ReleasesTimeline } from '@/components/landing/releases-timeline';
import { Reveal } from '@/components/shared/reveal';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ReleasesPage' });
  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'site',
    title: t('metaTitle'),
    description: t('metaDescription'),
    eyebrow: t('eyebrow'),
  });

  return buildPublicPageMetadata({
    locale,
    path: '/releases',
    title: t('metaTitle'),
    description: t('metaDescription'),
    ogImage,
  });
}

export default async function ReleasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'ReleasesPage' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const tNav = await getTranslations({ locale, namespace: 'Nav' });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: tBrand('name'), path: '' },
    { name: tNav('releases'), path: '/releases' },
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
        {/* Header section */}
        <section className="relative isolate">
          <div className="container mx-auto px-4 pt-16 pb-10 md:pt-24 md:pb-14">
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

        {/* Timeline Section */}
        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4">
            <ReleasesTimeline />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
