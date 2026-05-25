import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/page-header';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="Daily checklist"
        description="Plan your day with a simple, point-rewarded checklist."
      />
      <ComingSoon
        items={[
          'Add/edit items with custom reward points (server: /checklist/:date)',
          'Drag-and-drop reordering, mark complete, daily totals',
          'Carry-over of recurring items across days',
        ]}
      />
    </>
  );
}
