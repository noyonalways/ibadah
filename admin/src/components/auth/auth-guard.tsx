'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAdmin } from '@/hooks/use-auth';
import { BrandMark } from '@/components/shared/brand-mark';

/**
 * Client-side admin auth guard. Until the server adds `requireAdmin`
 * (design.md §10.3) any authenticated user passes; once `user.isAdmin`
 * is exposed by `/auth/me`, this guard upgrades to enforce that flag.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useCurrentAdmin();

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
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Authorizing…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
