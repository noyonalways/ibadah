'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

const FAQ_KEYS = ['free', 'auth', 'languages', 'privacy', 'prayer_times', 'scoring'] as const;

/**
 * Accessible FAQ — each item is a native `<details>` for free keyboard
 * support and HTML semantics. The chevron rotates on `open` via the
 * `[&_details[open]_svg]` group pattern.
 *
 * `compact` strips the section padding/header so it can be embedded inside
 * other surfaces (e.g. the FAQ standalone page).
 */
export function FAQ({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('Landing');

  const Body = (
    <div className="mx-auto max-w-3xl">
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur">
        {FAQ_KEYS.map((key, i) => (
          <Reveal key={key} delay={i * 60} as="li">
            <details className="group/faq peer/faq cursor-pointer">
              <summary className="flex list-none items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                <span className="text-base font-medium tracking-tight">
                  {t(`faq_${key}_q`)}
                </span>
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-open/faq:rotate-45"
                >
                  <Plus className="size-4" />
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 text-sm leading-relaxed text-muted-foreground">
                {t(`faq_${key}_a`)}
              </div>
            </details>
          </Reveal>
        ))}
      </ul>
    </div>
  );

  if (compact) return Body;

  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {t('faq_eyebrow')}
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {t('faq_title')}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              {t('faq_subtitle')}
            </p>
          </div>
        </Reveal>
        <div className="mt-14">{Body}</div>
      </div>
    </section>
  );
}
