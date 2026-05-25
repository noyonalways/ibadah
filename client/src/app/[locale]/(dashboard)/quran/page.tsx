import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/page-header';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export default async function QuranPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="Quran"
        description="Log pages, minutes, or surah/ayah ranges read each day."
      />
      <ComingSoon
        items={[
          'Daily entry: pages read, minutes spent, surah/ayah from–to',
          'Backdating supported (PUT /quran/:date already implemented on the server)',
          'Weekly bar chart and monthly heatmap',
        ]}
      />
    </>
  );
}
