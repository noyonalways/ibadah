import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail } from 'lucide-react';

import { Link, type AppLocale } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Footer } from '@/components/landing/footer';
import { FAQ } from '@/components/landing/faq';
import { Reveal } from '@/components/shared/reveal';
import { IslamicDivider } from '@/components/shared/islamic-divider';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'FAQPage' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'faq',
    title: t('metaTitle'),
    description: t('metaDescription'),
    eyebrow: t('eyebrow'),
    arabic: tBrand('bismillah_ar'),
  });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: `/${locale}/faq` },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `/${locale}/faq`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: t('metaTitle') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [ogImage],
    },
  };
}

export default async function FAQStandalonePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'FAQPage' });
  const tLanding = await getTranslations({ locale, namespace: 'Landing' });

  // FAQPage JSON-LD — gives Google a chance to render rich Q&A snippets.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      'free',
      'auth',
      'languages',
      'privacy',
      'prayer_times',
      'scoring',
    ].map((key) => ({
      '@type': 'Question',
      name: tLanding(`faq_${key}_q`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: tLanding(`faq_${key}_a`),
      },
    })),
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <MarketingBackdrop />
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="relative flex-1">
        {/* Hero */}
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

        {/* The FAQ accordion (reused from the landing) */}
        <section className="pb-12 md:pb-16">
          <div className="container mx-auto px-4">
            <FAQ compact />
          </div>
        </section>

        <IslamicDivider className="mx-auto max-w-md" />

        {/* Still curious */}
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="glass-card mx-auto max-w-3xl rounded-3xl p-8 text-center md:p-12">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto ring-1 ring-inset ring-primary/15">
                  <Mail className="size-5" />
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
                  {t('still_title')}
                </h2>
                <p className="mt-3 text-pretty text-muted-foreground md:text-lg">
                  {t('still_body')}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-gradient-to-r from-primary via-primary to-accent-deep px-7 shadow-xl shadow-primary/25 hover:shadow-primary/40"
                  >
                    <Link href="/register">{t('still_cta')}</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="rounded-full">
                    <Link href="/about">{tLanding('cta_secondary')}</Link>
                  </Button>
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
