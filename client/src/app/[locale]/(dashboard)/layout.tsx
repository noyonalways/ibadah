import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardTopbar } from '@/components/dashboard/topbar';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <div className="relative flex min-h-dvh bg-background">
        {/* Ambient backdrop, fixed behind everything */}
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-aurora-soft opacity-60"
          aria-hidden
        />

        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardTopbar />
          <main className="flex-1 px-4 py-8 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
