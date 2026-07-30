import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Link, type AppLocale } from '@/i18n/routing';
import { ogImageUrl } from '@/lib/og-url';
import { buildBreadcrumbJsonLd, buildPublicPageMetadata } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Footer } from '@/components/landing/footer';
import { Reveal } from '@/components/shared/reveal';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

import { AiHeroSection } from '@/components/ai-showcase/ai-hero-section';
import { AiFeatureGrid } from '@/components/ai-showcase/ai-feature-grid';
import { AiHowItWorks } from '@/components/ai-showcase/ai-how-it-works';
import { AiInteractiveSandbox } from '@/components/ai-showcase/ai-interactive-sandbox';
import { AiAuthenticityTrust } from '@/components/ai-showcase/ai-authenticity-trust';
import { AiFaq } from '@/components/ai-showcase/ai-faq';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AiShowcase' });
  
  const title = `AI Features & Knowledge Engine — ${t('title_line2')}`;
  const description = t('subtitle');

  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'feature',
    title,
    description,
    eyebrow: t('badge'),
  });

  return buildPublicPageMetadata({
    locale,
    path: '/ai',
    title,
    description,
    ogImage,
    keywords: [
      'Islamic AI assistant',
      'Quranic vector search',
      'Authentic Hadith RAG',
      'Islamic guidance AI',
      'Islamic knowledge engine',
      'Muslim AI assistant',
    ],
  });
}

export default async function AiShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AiShowcase' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const tNav = await getTranslations({ locale, namespace: 'Nav' });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: tBrand('name'), path: '' },
    { name: tNav('ai'), path: '/ai' },
  ]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background selection:bg-primary/20">
      <MarketingBackdrop />
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="relative flex-1">
        {/* Hero Section */}
        <AiHeroSection />

        {/* Feature Grid */}
        <AiFeatureGrid />

        {/* How It Works RAG Architecture */}
        <AiHowItWorks />

        {/* Interactive AI Sandbox */}
        <AiInteractiveSandbox />

        {/* Authenticity & Scholar Trust */}
        <AiAuthenticityTrust />

        {/* FAQ Accordion */}
        <AiFaq />

        {/* Bottom CTA Card */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-deep to-accent-deep p-8 sm:p-12 text-primary-foreground shadow-2xl shadow-primary/30">
                <GeometricPattern className="text-white" opacity={0.08} />
                <div
                  className="absolute -bottom-32 -right-20 size-[420px] rounded-full bg-accent/40 blur-3xl"
                  aria-hidden
                />
                <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur text-white mb-4">
                      <Sparkles className="size-3.5" />
                      <span>Experience Authentic AI</span>
                    </div>
                    <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight md:text-4xl">
                      Elevate Your Daily Worship with Intelligent Guidance
                    </h2>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-primary-foreground/90">
                      Join Muslims worldwide using Ibadah to track worship, reflect on authentic Quranic Ayahs, and build consistent daily spiritual habits.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <Button
                      asChild
                      size="lg"
                      className="group rounded-full bg-white px-8 text-primary font-semibold hover:bg-white/95 shadow-lg"
                    >
                      <Link href="/register">
                        {t('cta_explore_app')}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="lg"
                      className="rounded-full text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground"
                    >
                      <Link href="/features">Explore All Features</Link>
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
