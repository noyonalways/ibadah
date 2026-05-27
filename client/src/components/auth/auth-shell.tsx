import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { BrandMark } from '@/components/shared/brand-mark';
import { GlowOrbs } from '@/components/shared/glow-orbs';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { IslamicDivider } from '@/components/shared/islamic-divider';

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
  const t = useTranslations('Brand');
  const tAuth = useTranslations('Auth');

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---------- Visual / inspirational pane ---------- */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-deep to-tertiary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <GeometricPattern className="text-white" opacity={0.1} />
        <GlowOrbs variant="twilight" />

        <div className="relative z-10 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={36} className="ring-1 ring-white/20" />
            <div className="flex flex-col leading-none text-white">
              <span className="text-base font-semibold tracking-tight">{t('name')}</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/70">
                {t('tagline')}
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

          <IslamicDivider className="mt-6 max-w-[200px] text-white/40" />

          <p className="mt-6 text-pretty text-lg italic leading-relaxed text-white/85">
            &ldquo;{tAuth('verseQuote')}&rdquo;
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/60">
            {tAuth('verseQuoteCite')}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-white">
          <Stat value="5" label={tAuth('stat_dailyPrayers')} />
          <Stat value="∞" label={tAuth('stat_reflection')} />
          <Stat value="1" label={tAuth('stat_heart')} />
        </div>
      </aside>

      {/* ---------- Form pane ---------- */}
      <main className="relative grid place-items-center px-4 py-10 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-aurora-soft lg:hidden"
          aria-hidden
        />

        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark size={36} />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight">{t('name')}</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t('tagline')}
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
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/70">{label}</p>
    </div>
  );
}
