import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/page-header';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export default async function DhikrPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="Dhikr"
        description="SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illa Allah — and your custom dhikr."
      />
      <ComingSoon
        items={[
          'Tap-to-count UI per dhikr with target progress bars',
          'Default presets seeded on first load (already supported by /dhikr/:date)',
          'Custom dhikr via Settings; configurable daily targets',
        ]}
      />
    </>
  );
}
