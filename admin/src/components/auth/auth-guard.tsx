'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAdmin, useLogout } from '@/hooks/use-auth';
import { isAdmin } from '@/store/auth-store';
import { BrandMark } from '@/components/shared/brand-mark';
import { AccessDenied } from '@/components/auth/access-denied';

/**
 * Strict admin-only guard.
 *
 * Behaviour:
 *   - No session → redirect to /login.
 *   - Session, but `role !== 'admin'` (or suspended) → render an explicit
 *     "access denied" screen with a sign-out button. We deliberately do
 *     NOT auto-redirect them anywhere — the user needs to know why they
 *     were blocked.
 *   - Admin → render children.
 *
 * Authorization is also enforced server-side by `requireAdmin` middleware
 * on every /admin/* route; this guard is purely for UX.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useCurrentAdmin();
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="grid min-h-dvh place-items-center bg-aurora-soft">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <BrandMark size={48} animate />
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Authorizing…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin(user)) {
    return (
      <AccessDenied
        user={user}
        onSignOut={() => {
          logout();
          router.replace('/login');
        }}
      />
    );
  }

  return <>{children}</>;
}
