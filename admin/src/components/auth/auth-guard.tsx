'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAdmin, useLogout } from '@/hooks/use-auth';
import { BrandMark } from '@/components/shared/brand-mark';
import { AccessDenied } from '@/components/auth/access-denied';

/**
 * Client-side admin auth guard.
 *
 *   - If the session is still loading, show a branded splash.
 *   - If there is no session, redirect to /login.
 *   - If the session belongs to a non-admin (or a suspended account),
 *     show the AccessDenied wall — NEVER render the panel chrome.
 *   - Otherwise render the panel.
 *
 * The server-side `requireAdmin` middleware is the source of truth
 * (it returns 403 to anyone without `role==='admin'`); this guard is
 * the UX layer that turns those 403s into a graceful screen.
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

  // role/suspended come from the server's SafeUser; older sessions that
  // predate the role flag are tolerated (treated as admin) so existing
  // single-tenant developers don't get locked out unexpectedly.
  const role = user.role;
  if ((role && role !== 'admin') || user.suspended) {
    const handleSignOut = () => {
      logout();
      router.replace('/login');
    };
    return <AccessDenied user={user} onSignOut={handleSignOut} />;
  }

  return <>{children}</>;
}
