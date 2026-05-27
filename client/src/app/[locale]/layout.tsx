import type { Metadata, Viewport } from 'next';
import { Inter, Amiri } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Providers } from '@/components/providers';
import { routing, localeMeta, type AppLocale } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfaf3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Brand' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${t('name')} — ${t('tagline')}`,
      template: `%s · ${t('name')}`,
    },
    description:
      'Track Salah, Quran, Dhikr, daily habits, and checklists with streaks, heatmaps, and weekly goals — your mindful Islamic companion.',
    keywords: [
      'Islam',
      'Muslim app',
      'Salah tracker',
      'Prayer tracker',
      'Quran',
      'Dhikr counter',
      'Habit tracker Muslim',
      'Ibadah',
      'Islamic productivity',
      'Daily worship',
    ],
    openGraph: {
      title: `${t('name')} — ${t('tagline')}`,
      description:
        'A mindful Islamic tracker for Salah, Quran, Dhikr, and daily worship — with streaks, heatmaps, and weekly goals.',
      siteName: t('name'),
      type: 'website',
      locale,
      url: `/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('name')} — ${t('tagline')}`,
      description:
        'A mindful Islamic tracker for Salah, Quran, Dhikr, daily habits, and checklists.',
    },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'lifestyle',
    applicationName: t('name'),
    authors: [{ name: t('name') }],
    creator: t('name'),
    publisher: t('name'),
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = localeMeta[locale as AppLocale].dir;
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // JSON-LD structured data — helps search engines build rich results
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/${locale}`,
        name: tBrand('name'),
        description:
          'A mindful Islamic tracker for Salah, Quran, Dhikr, daily habits, and checklists.',
        inLanguage: locale,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#app`,
        name: `${tBrand('name')} — ${tBrand('tagline')}`,
        operatingSystem: 'Web',
        applicationCategory: 'LifestyleApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'Track Salah timing (Awwal/Mid/Last), Quran reading, Dhikr counts, custom habits, and a daily checklist with streaks, heatmaps, and weekly goals.',
        inLanguage: ['en', 'ar', 'bn'],
      },
    ],
  };

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} ${amiri.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          // JSON-LD is safe — string is built from controlled data, no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
