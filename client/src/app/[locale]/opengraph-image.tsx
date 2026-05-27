import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { OG_SIZE, renderOgCard } from '@/lib/og-template';
import { loadOgFonts } from '@/lib/og-fonts';
import { routing, type AppLocale } from '@/i18n/routing';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const runtime = 'edge';

export const alt =
  'Ibadah — A mindful Islamic tracker for Salah, Quran, Dhikr, and daily worship';

function resolveLocale(input: string): AppLocale {
  return (routing.locales as readonly string[]).includes(input)
    ? (input as AppLocale)
    : routing.defaultLocale;
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const tLanding = await getTranslations({ locale, namespace: 'Landing' });

  const brand = tBrand('name');
  const tagline = tBrand('tagline');
  const eyebrow = tLanding('heroEyebrow');
  const title = `${tLanding('heroTitleLine1')} ${tLanding('heroTitleLine2a')} ${tLanding(
    'heroTitleLine2b',
  )}`;
  const description = tLanding('heroSubtitle');
  // Latin transliteration accent — see src/lib/og-fonts.ts for why
  // we don't render Arabic glyphs in OG cards.
  const accent = 'Bismillāh — A mindful Islamic tracker';

  const fonts = await loadOgFonts({
    primary: `${brand} ${tagline} ${eyebrow} ${title} ${description} ${accent}`,
  });

  return new ImageResponse(
    renderOgCard({
      brand,
      tagline,
      eyebrow,
      title,
      description,
      arabic: accent,
    }),
    { ...size, fonts },
  );
}
