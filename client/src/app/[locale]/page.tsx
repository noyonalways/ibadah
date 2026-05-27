import { setRequestLocale } from 'next-intl/server';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Hero } from '@/components/landing/hero';
import { ProofBar } from '@/components/landing/proof-bar';
import { Pillars } from '@/components/landing/pillars';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Personas } from '@/components/landing/personas';
import { DhikrRibbon } from '@/components/landing/dhikr-ribbon';
import { QuoteSection } from '@/components/landing/quote-section';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <MarketingBackdrop />
      <MarketingNav />
      <main className="relative flex-1">
        <Hero />
        <ProofBar />
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
  );
}
