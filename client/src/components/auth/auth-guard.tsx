'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useCurrentUser } from '@/hooks/use-auth';
import { BrandMark } from '@/components/shared/brand-mark';

/**
 * Client-side auth guard. For pages that require an authenticated user.
 * Redirects to /login if no user is found after the auth query resolves.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-aurora-soft">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <BrandMark size={48} className="animate-breathe" />
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
