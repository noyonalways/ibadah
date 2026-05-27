'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/shared/brand-mark';
import type { AdminUser } from '@/store/auth-store';

/**
 * Hard wall shown to anyone who reaches the admin panel without
 * `role === 'admin'`. We never disclose internal info beyond what the
 * user already knows (their own email and role) and we offer a single
 * action: sign out and try again with a different account.
 */
export function AccessDenied({
  user,
  onSignOut,
}: {
  user: AdminUser | null;
  onSignOut: () => void;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-aurora-soft px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-2xl shadow-primary/5">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is reserved for administrators. Your account does not currently have the
            required privileges.
          </p>

          {user && (
            <div className="mt-5 rounded-lg border border-border/60 bg-muted/30 p-3 text-left">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Signed in as
              </p>
              <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                role: <span className="font-mono">{user.role}</span>
                {user.suspended && (
                  <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                    suspended
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={onSignOut} className="w-full sm:w-auto">
              Sign out and switch accounts
            </Button>
            <Button asChild variant="ghost" className="w-full sm:w-auto">
              <Link href="https://github.com/noyonalways/ibadah" target="_blank" rel="noreferrer">
                Contact support
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BrandMark size={20} />
          <span>Ibadah Admin · Authorized personnel only</span>
        </div>
      </div>
    </div>
  );
}
