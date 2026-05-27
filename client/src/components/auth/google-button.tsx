'use client';

import * as React from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useGoogleAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { ApiClientError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: { id?: GoogleAccountsId };
    };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Renders the official Google Identity Services button. Falls back to a
 * styled placeholder when no NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
 */
export function GoogleButton({ disabled }: { disabled?: boolean }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const googleAuth = useGoogleAuth();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);

  const initialize = React.useCallback(() => {
    if (!CLIENT_ID || !containerRef.current) return;
    const accounts = window.google?.accounts?.id;
    if (!accounts) return;

    accounts.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        if (!response.credential) return;
        try {
          await googleAuth.mutateAsync({
            idToken: response.credential,
            locale: locale as 'en' | 'bn' | 'ar',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
          toast.success(t('loginSuccess'));
          router.push('/dashboard');
        } catch (err) {
          const msg = err instanceof ApiClientError ? err.message : t('googleError');
          toast.error(msg);
        }
      },
      auto_select: false,
      use_fedcm_for_prompt: true,
    });

    accounts.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: containerRef.current.clientWidth || 320,
      logo_alignment: 'center',
    });
  }, [googleAuth, locale, router, t]);

  React.useEffect(() => {
    if (!scriptReady) return;
    initialize();
  }, [scriptReady, initialize]);

  // No client id — show a clean disabled placeholder. Lets the rest of the
  // auth UI keep its layout without breaking.
  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'flex h-11 w-full items-center justify-center gap-3 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground/70',
          'cursor-not-allowed',
        )}
        aria-label="Google sign-in not configured"
      >
        <GoogleGlyph />
        <span>{t('googleSignIn')}</span>
      </button>
    );
  }

  return (
    <>
      <Script
        src={GIS_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />

      <div className="relative w-full">
        {/* Container Google renders the button into. */}
        <div
          ref={containerRef}
          className="flex w-full justify-center [color-scheme:light]"
          aria-busy={googleAuth.isPending || undefined}
        />

        {/* Loading overlay while we exchange the ID token with our server. */}
        {googleAuth.isPending && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-card/80 backdrop-blur-sm">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {t('googleProcessing')}
            </span>
          </div>
        )}

        {/* Disabled overlay (parent form busy etc.) */}
        {!googleAuth.isPending && disabled && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full bg-card/40"
            aria-hidden
          />
        )}
      </div>
    </>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
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
