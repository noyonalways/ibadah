import { setRequestLocale } from 'next-intl/server';
import { MarketingNav } from '@/components/landing/marketing-nav';
import { MarketingBackdrop } from '@/components/landing/marketing-backdrop';
import { Hero } from '@/components/landing/hero';
import { Pillars } from '@/components/landing/pillars';
import { Features } from '@/components/landing/features';
import { QuoteSection } from '@/components/landing/quote-section';
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
        <Pillars />
        <QuoteSection />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
