import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { type AppLocale } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import { buildBreadcrumbJsonLd, buildPublicPageMetadata } from '@/lib/seo';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Footer } from '@/components/landing/footer';
import { Reveal } from '@/components/shared/reveal';
import { IslamicDivider } from '@/components/shared/islamic-divider';

const SECTIONS: Array<{ key: (typeof SECTION_KEYS)[number]; paragraphs: 1 | 2 }> = [
  { key: 'acceptance', paragraphs: 1 },
  { key: 'service', paragraphs: 2 },
  { key: 'account', paragraphs: 1 },
  { key: 'conduct', paragraphs: 1 },
  { key: 'content', paragraphs: 1 },
  { key: 'disclaimer', paragraphs: 1 },
  { key: 'liability', paragraphs: 1 },
  { key: 'termination', paragraphs: 1 },
  { key: 'changes', paragraphs: 1 },
  { key: 'contact', paragraphs: 1 },
];

const SECTION_KEYS = [
  'acceptance',
  'service',
  'account',
  'conduct',
  'content',
  'disclaimer',
  'liability',
  'termination',
  'changes',
  'contact',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TermsPage' });
  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'site',
    title: t('metaTitle'),
    description: t('metaDescription'),
    eyebrow: t('eyebrow'),
  });

  return buildPublicPageMetadata({
    locale,
    path: '/terms',
    title: t('metaTitle'),
    description: t('metaDescription'),
    ogImage,
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TermsPage' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const tLanding = await getTranslations({ locale, namespace: 'Landing' });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: tBrand('name'), path: '' },
    { name: tLanding('footer_terms'), path: '/terms' },
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
          <div className="container mx-auto px-4 pt-16 pb-10 md:pt-24 md:pb-14">
            <div className="mx-auto max-w-3xl">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                  {t('eyebrow')}
                </span>
              </Reveal>
              <Reveal delay={120}>
                <h1 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.2rem)] font-bold leading-[1.08] tracking-tight">
                  {t('title')}
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-5 text-pretty text-base text-muted-foreground md:text-lg">
                  {t('lead')}
                </p>
                <p className="mt-3 text-sm text-muted-foreground/80">{t('updated')}</p>
              </Reveal>
            </div>
          </div>
        </section>

        <IslamicDivider className="mx-auto max-w-md" />

        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-3xl space-y-12 px-4">
            {SECTIONS.map(({ key, paragraphs }, i) => (
              <Reveal key={key} delay={i * 60}>
                <article>
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {t(`section_${key}_title`)}
                  </h2>
                  <div className="mt-4 space-y-4 text-pretty text-base leading-relaxed text-muted-foreground">
                    <p>{t(`section_${key}_p1`)}</p>
                    {paragraphs === 2 ? <p>{t(`section_${key}_p2`)}</p> : null}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
