import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/page-header';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export default async function HabitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="Habits"
        description="Define your own habits — fasting, charity, dua — with custom reward points."
      />
      <ComingSoon
        items={[
          'Habit manager: create / edit / archive (CRUD already on /habits)',
          'Per-day toggle list with totalPoints rollup (/habits/days/:date)',
          'Streaks per habit and weekly completion summary',
        ]}
      />
    </>
  );
}
