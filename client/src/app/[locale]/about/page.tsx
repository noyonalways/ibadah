import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ShieldCheck, BadgeMinus, BookOpenText, Languages } from 'lucide-react';

import { Link, type AppLocale } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import { buildBreadcrumbJsonLd, buildPublicPageMetadata } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Footer } from '@/components/landing/footer';
import { Reveal } from '@/components/shared/reveal';
import { IslamicDivider } from '@/components/shared/islamic-divider';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'About' });
  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'about',
    title: t('metaTitle'),
    description: t('metaDescription'),
    eyebrow: t('eyebrow'),
  });
  return buildPublicPageMetadata({
    locale,
    path: '/about',
    title: t('metaTitle'),
    description: t('metaDescription'),
    ogImage,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const tNav = await getTranslations({ locale, namespace: 'Nav' });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: tBrand('name'), path: '' },
    { name: tNav('about'), path: '/about' },
  ]);

  const VALUES = [
    { key: 'privacy', icon: ShieldCheck, tone: 'text-primary bg-primary/10 ring-primary/15' },
    {
      key: 'no_ads',
      icon: BadgeMinus,
      tone: 'text-accent-foreground bg-accent/30 ring-accent/40',
    },
    {
      key: 'respect',
      icon: BookOpenText,
      tone: 'text-tertiary bg-tertiary/15 ring-tertiary/20',
    },
    {
      key: 'localized',
      icon: Languages,
      tone: 'text-primary bg-primary/10 ring-primary/15',
    },
  ] as const;

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <MarketingBackdrop />
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="relative flex-1">
        {/* Hero */}
        <section className="relative isolate">
          <div className="container mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                {t('eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={120}>
              <p
                className="font-display mt-7 text-[clamp(1.4rem,3vw,2rem)] leading-tight text-primary/70 dark:text-primary/80"
                dir="rtl"
                lang="ar"
              >
                {t('bismillah')}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <h1 className="mt-2 max-w-3xl text-balance text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight">
                <span className="block">{t('title_1')}</span>
                <span className="block">
                  <span className="text-gradient">{t('title_2')}</span>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={280}>
              <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
                {t('lead')}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Story */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-[1fr_1.4fr] md:gap-16">
            <Reveal>
              <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                {t('story_title')}
              </h2>
            </Reveal>
            <div className="space-y-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              <Reveal delay={100}>
                <p>{t('story_p1')}</p>
              </Reveal>
              <Reveal delay={180}>
                <p>{t('story_p2')}</p>
              </Reveal>
              <Reveal delay={260}>
                <p>{t('story_p3')}</p>
              </Reveal>
            </div>
          </div>
        </section>

        <IslamicDivider className="mx-auto max-w-md" />

        {/* Values */}
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                  {t('values_eyebrow')}
                </span>
                <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
                  {t('values_title')}
                </h2>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {VALUES.map(({ key, icon: Icon, tone }, i) => (
                <Reveal key={key} delay={i * 100}>
                  <article className="lift-hover relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-7 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-11 place-items-center rounded-xl ring-1 ring-inset ${tone}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {t(`value_${key}_title`)}
                      </h3>
                    </div>
                    <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
                      {t(`value_${key}_desc`)}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* For-you band */}
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                  {t('for_eyebrow')}
                </span>
                <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
                  {t('for_title')}
                </h2>
                <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                  {t('for_body')}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Verse */}
        <section className="relative py-16 md:py-24">
          <Reveal>
            <div className="container mx-auto max-w-3xl px-4 text-center">
              <p
                className="font-display text-[clamp(1.5rem,3.6vw,2.6rem)] leading-[1.6] text-foreground/90"
                dir="rtl"
                lang="ar"
              >
                وَأَنْ لَيْسَ لِلْإِنْسَانِ إِلَّا مَا سَعَىٰ
              </p>
              <IslamicDivider className="mx-auto mt-8 max-w-xs" />
              <p className="mt-6 text-pretty text-base italic leading-relaxed text-muted-foreground md:text-lg">
                &ldquo;{t('verse')}&rdquo;
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground/70">
                {t('verse_cite')}
              </p>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
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
                    <h3 className="text-balance text-2xl font-bold leading-tight tracking-tight md:text-4xl">
                      {t('cta_title')}
                    </h3>
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
