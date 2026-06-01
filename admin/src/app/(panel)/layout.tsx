import { AuthGuard } from '@/components/auth/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminTopbar } from '@/components/admin/topbar';
import { AdminAIWidget } from '@/components/ai/admin-ai-widget';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-dvh bg-background">
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-aurora-soft opacity-60"
          aria-hidden
        />
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 px-4 pb-12 pt-5 lg:px-8 lg:pt-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
          </main>
        </div>

        {/* Floating admin copilot — hides itself on /assistant. */}
        <AdminAIWidget />
      </div>
    </AuthGuard>
  );
}
