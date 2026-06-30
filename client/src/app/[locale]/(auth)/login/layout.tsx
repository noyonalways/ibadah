import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { buildPublicPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });

  return buildPublicPageMetadata({
    locale,
    path: '/login',
    title: t('loginMetaTitle'),
    description: t('loginMetaDescription'),
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
