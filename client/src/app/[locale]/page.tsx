import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { LandingMobileExperience } from '@/components/landing/landing-mobile-experience';
import { Hero } from '@/components/landing/hero';
import { Pillars } from '@/components/landing/pillars';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Personas } from '@/components/landing/personas';
import { DhikrRibbon } from '@/components/landing/dhikr-ribbon';
import { QuoteSection } from '@/components/landing/quote-section';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { AIWidget } from '@/components/ai/ai-widget';
import { buildPublicPageMetadata } from '@/lib/seo';
import { ogImageUrl } from '@/lib/og-url';
import type { AppLocale } from '@/i18n/routing';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });

  const title = `${tBrand('name')} — ${tBrand('tagline')}`;
  const description = t('heroSubtitle');
  const ogImage = ogImageUrl({
    locale: locale as AppLocale,
    kind: 'site',
    title,
    description,
    eyebrow: t('heroEyebrow'),
  });

  return buildPublicPageMetadata({
    locale,
    path: '',
    title,
    description,
    ogImage,
    siteName: tBrand('name'),
    keywords: [
      'Islamic habit tracker',
      'Salah tracker app',
      'Quran reading tracker',
      'Dhikr counter',
      'Muslim worship app',
      'Ibadah',
    ],
  });
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <MarketingBackdrop />

      {/* Mobile — native app shell with tabs + onboarding */}
      <LandingMobileExperience />

      {/* Desktop — full marketing site */}
      <div className="hidden lg:contents">
        <MarketingNav />
        <main className="relative flex-1">
          <Hero />
          <Pillars />
          <HowItWorks />
          <Features />
          <Personas />
          <DhikrRibbon />
          <QuoteSection />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>

      {/* Floating AI assistant — answers questions about the app and
          helps visitors decide if Ibadah fits their practice. */}
      <AIWidget
        surface="landing"
        liftAboveBottomNav
        greeting="Assalamu alaikum. I'm the Ibadah assistant — happy to answer questions about the app, the scoring rules, or how it might fit into your day."
        suggestions={[
          'What can I do with Ibadah?',
          'How does the Salah scoring work?',
          'Is my worship log private?',
        ]}
      />
    </div>
  );
}
