import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardTopbar } from '@/components/dashboard/topbar';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { MobileTopbar } from '@/components/dashboard/mobile-topbar';

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

        {/* Desktop sidebar */}
        <DashboardSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* App bar — different on mobile vs desktop */}
          <MobileTopbar />
          <DashboardTopbar />

          <main className="flex-1 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 sm:pt-5 lg:px-8 lg:pb-12 lg:pt-8">
            <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">{children}</div>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
