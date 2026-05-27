import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { OG_SIZE, renderOgCard } from '@/lib/og-template';
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

  return new ImageResponse(
    renderOgCard({
      brand: tBrand('name'),
      tagline: tBrand('tagline'),
      eyebrow: tLanding('heroEyebrow'),
      title: `${tLanding('heroTitleLine1')} ${tLanding('heroTitleLine2a')} ${tLanding(
        'heroTitleLine2b',
      )}`,
      description: tLanding('heroSubtitle'),
      arabic: tBrand('bismillah_ar'),
    }),
    { ...size },
  );
}
