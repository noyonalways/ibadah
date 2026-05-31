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
import { AIWidget } from '@/components/ai/ai-widget';

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

      {/* Floating AI assistant — answers questions about the app and
          helps visitors decide if Ibadah fits their practice. */}
      <AIWidget
        surface="landing"
        liftAboveBottomNav={false}
        greeting="Assalamu alaikum. I'm the Ibadah assistant — happy to answer questions about the app, the scoring rules, or how it might fit into your day."
        suggestions={[
          'How does the Salah scoring work?',
          'What languages are supported?',
          'Is my worship log private?',
        ]}
      />
    </div>
  );
}
