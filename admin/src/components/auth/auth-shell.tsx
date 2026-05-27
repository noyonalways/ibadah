'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/shared/brand-mark';

/**
 * Two-pane auth shell mirroring the user app's auth surface, with copy
 * adapted for an internal-tool tone.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Inspirational pane */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-deep to-tertiary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 bg-pattern opacity-40"
          aria-hidden
        />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={36} className="ring-1 ring-white/20" />
            <div className="flex flex-col leading-none text-white">
              <span className="text-base font-semibold tracking-tight">Ibadah Admin</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/70">
                Operations Console
              </span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-md text-white">
          <p
            className="font-display text-[clamp(1.5rem,3.4vw,2.4rem)] leading-[1.6] text-white/95"
            dir="rtl"
            lang="ar"
          >
            وَأَقِمِ ٱلصَّلَاةَ لِذِكْرِي
          </p>
          <p className="mt-6 text-pretty text-lg italic leading-relaxed text-white/85">
            &ldquo;A console for the ones who keep the lamps lit.&rdquo;
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/60">
            Internal use only
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-white">
          <Stat value="Users" label="manage" />
          <Stat value="Stats" label="monitor" />
          <Stat value="Config" label="control" />
        </div>
      </aside>

      {/* Form pane */}
      <main className="relative grid place-items-center px-4 py-10 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-aurora-soft lg:hidden"
          aria-hidden
        />

        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark size={36} />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight">Ibadah Admin</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Operations Console
              </span>
            </div>
          </Link>

          <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-2xl shadow-primary/5 sm:p-10">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/70">{label}</p>
    </div>
  );
}
