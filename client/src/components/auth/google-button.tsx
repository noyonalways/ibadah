'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/**
 * Continue-with-Google button.
 *
 * The server now drives the OAuth dance via Passport.js (Authorization
 * Code flow). The button is therefore a plain link that takes the user
 * to `${API}/auth/google` with a few hints the server stores in a
 * signed state JWT (locale, timezone, post-login destination).
 *
 * No Google scripts are loaded into the SPA — that simplifies CSP and
 * means a slow `accounts.google.com/gsi/client` payload can never delay
 * the auth screen on first paint.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

interface GoogleButtonProps {
  disabled?: boolean;
  /**
   * In-app path to land on after the OAuth round-trip finishes. Must
   * begin with `/`. The server validates and re-encodes this — anything
   * fishy is silently dropped, so it's safe to forward the request URL
   * directly when needed.
   */
  returnTo?: string;
  /** Optional id for screen-reader / form-association purposes. */
  id?: string;
}

export function GoogleButton({
  disabled,
  returnTo = '/dashboard',
  id,
}: GoogleButtonProps) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [redirecting, setRedirecting] = React.useState(false);

  const href = React.useMemo(() => {
    const url = new URL(`${API_URL}/auth/google`);
    url.searchParams.set('locale', locale);
    // Best-effort timezone detection — if the browser refuses, the server
    // falls back to "UTC" when seeding a brand-new account.
    try {
      url.searchParams.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      /* ignore */
    }
    if (returnTo) url.searchParams.set('returnTo', returnTo);
    return url.toString();
  }, [locale, returnTo]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    setRedirecting(true);
    // The browser will navigate away; nothing else to do here.
  };

  return (
    <a
      id={id}
      href={href}
      onClick={handleClick}
      aria-disabled={disabled || redirecting || undefined}
      className={cn(
        'group relative flex h-11 w-full items-center justify-center gap-3 rounded-full border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-all',
        'hover:border-primary/40 hover:bg-card/80 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        (disabled || redirecting) &&
          'pointer-events-none cursor-not-allowed opacity-60 hover:shadow-sm',
      )}
    >
      {redirecting ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <GoogleGlyph />
      )}
      <span>{redirecting ? t('googleProcessing') : t('googleSignIn')}</span>
    </a>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.71-.064-1.392-.182-2.045H12v3.868h5.382c-.232 1.25-.937 2.31-1.998 3.018v2.51h3.232c1.89-1.74 2.984-4.298 2.984-7.351z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.616-2.422l-3.232-2.51c-.895.6-2.04.955-3.384.955-2.6 0-4.804-1.755-5.59-4.115H3.073v2.59A9.998 9.998 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.908A6.014 6.014 0 0 1 6.09 12c0-.661.114-1.305.32-1.908V7.502H3.073A9.997 9.997 0 0 0 2 12c0 1.614.387 3.142 1.073 4.498l3.337-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.785.505 3.82 1.494l2.866-2.866C16.96 3.046 14.696 2 12 2A9.998 9.998 0 0 0 3.073 7.502l3.337 2.59C7.196 7.732 9.4 5.977 12 5.977z"
      />
    </svg>
  );
}
