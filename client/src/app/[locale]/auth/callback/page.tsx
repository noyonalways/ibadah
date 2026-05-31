'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/routing';
import { useGoogleExchange } from '@/hooks/use-auth';
import { ApiClientError } from '@/lib/api';
import { BrandMark } from '@/components/shared/brand-mark';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * OAuth callback handler.
 *
 * The server redirects here after a successful (or failed) Google
 * sign-in. We:
 *
 *   1. If a `?error=` is present, show it inline and offer a return to
 *      `/login` — no token exchange happens.
 *   2. Otherwise, POST the one-time `?code=` to the API, store the
 *      resulting JWTs, hydrate the auth store, and push to the
 *      validated `?returnTo` (or `/dashboard`).
 *
 * `useSearchParams()` requires a Suspense boundary in Next.js 15 (it
 * causes a CSR-bailout otherwise), so we split the inner client logic
 * out and wrap it in `<Suspense>`. This page is inherently dynamic —
 * its only purpose is to read query params off the redirect URL — so
 * the Suspense fallback is what users will see for the first frame
 * before the inner component reads the params.
 */

type Status = 'loading' | 'success' | 'error';

const SAFE_RETURN_TO = /^\/[^\s/](?!\/)[^\s]*$/;

function isSafeReturnPath(value: string | null): value is string {
  if (!value) return false;
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (/\s/.test(value)) return false;
  return SAFE_RETURN_TO.test(value) || value === '/';
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense fallback={<CallbackShell status="loading" title="" desc="" />}>
      <AuthCallbackInner />
    </React.Suspense>
  );
}

function AuthCallbackInner() {
  const t = useTranslations('Auth');
  const tCallback = useTranslations('Auth.callback');
  const params = useSearchParams();
  const router = useRouter();
  const exchange = useGoogleExchange();

  const code = params.get('code');
  const error = params.get('error');
  const errorMessage = params.get('message');
  const returnTo = params.get('returnTo');

  const [status, setStatus] = React.useState<Status>(
    error ? 'error' : code ? 'loading' : 'error',
  );
  const [detail, setDetail] = React.useState<string | null>(
    error ? errorMessage || translateOauthError(error, tCallback) : null,
  );
  const ranRef = React.useRef(false);

  React.useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (error) {
      setStatus('error');
      return;
    }
    if (!code) {
      setStatus('error');
      setDetail(tCallback('missingCode'));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await exchange.mutateAsync({ code });
        if (cancelled) return;
        setStatus('success');
        toast.success(t('loginSuccess'));

        const safe = isSafeReturnPath(returnTo) ? returnTo : '/dashboard';
        // Tiny pause so the success state is perceptible — feels less
        // like a flash and gives the toast a chance to start animating.
        window.setTimeout(() => router.replace(safe), 350);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiClientError ? err.message : tCallback('exchangeFailed');
        setStatus('error');
        setDetail(msg);
        toast.error(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
    // We intentionally only run on first mount. The state above already
    // reflects the URL-derived inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title =
    status === 'loading'
      ? tCallback('loadingTitle')
      : status === 'success'
        ? tCallback('successTitle')
        : tCallback('errorTitle');
  const desc =
    status === 'loading'
      ? tCallback('loadingDesc')
      : status === 'success'
        ? tCallback('successDesc')
        : detail ?? tCallback('errorDescGeneric');

  return (
    <CallbackShell
      status={status}
      title={title}
      desc={desc}
      actions={
        status === 'error' ? (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => router.replace('/login')}
              className="w-full sm:w-auto"
              variant="default"
            >
              {tCallback('backToLogin')}
            </Button>
            <Button
              onClick={() => router.replace('/')}
              className="w-full sm:w-auto"
              variant="outline"
            >
              {tCallback('backHome')}
            </Button>
          </div>
        ) : null
      }
    />
  );
}

function CallbackShell({
  status,
  title,
  desc,
  actions,
}: {
  status: Status;
  title: string;
  desc: string;
  actions?: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-10">
      <GeometricPattern className="text-primary" opacity={0.05} />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative w-full max-w-md text-center">
        <div className="mb-7 flex justify-center">
          <BrandMark size={40} />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-7 shadow-xl shadow-primary/5">
          <div className="mb-5 flex justify-center">
            <StatusBadge status={status} />
          </div>

          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          <p className="mt-2 min-h-[2.5em] text-sm text-muted-foreground">{desc}</p>

          {actions}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const base =
    'grid size-14 place-items-center rounded-2xl border shadow-sm transition-colors';
  if (status === 'loading') {
    return (
      <div
        className={cn(base, 'border-primary/30 bg-primary/5 text-primary')}
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div
        className={cn(
          base,
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        )}
        aria-live="polite"
      >
        <ShieldCheck className="size-6" />
      </div>
    );
  }
  return (
    <div
      className={cn(base, 'border-destructive/40 bg-destructive/10 text-destructive')}
      aria-live="assertive"
    >
      <ShieldAlert className="size-6" />
    </div>
  );
}

/**
 * Map known OAuth error codes (`access_denied`, `invalid_state`, …) to
 * translated copy. Unknown codes fall back to a generic message that
 * still mentions the raw code so support can debug.
 */
function translateOauthError(
  code: string,
  tCallback: (key: string, values?: Record<string, string | number>) => string,
): string {
  switch (code) {
    case 'access_denied':
      return tCallback('errorAccessDenied');
    case 'invalid_state':
      return tCallback('errorInvalidState');
    case 'no_account':
      return tCallback('errorNoAccount');
    case 'auth_failed':
      return tCallback('errorAuthFailed');
    default:
      return tCallback('errorUnknown', { code });
  }
}
