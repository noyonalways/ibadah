import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/page-header';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader title="Settings" description="Personalize Ibadah to fit your journey." />
      <ComingSoon
        items={[
          'Profile: name, avatar, timezone, locale (en / bn / ar)',
          'Salah scoring overrides (User.scoring already supported on the server)',
          'Default dhikr targets, habit reordering, dark/light theme',
          'Export your data (JSON) and password change',
        ]}
      />
    </>
  );
}
