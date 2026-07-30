'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

export function AiFaq() {
  const t = useTranslations();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const FAQS = [
    { q: t('AiShowcase.faq_q1'), a: t('AiShowcase.faq_a1') },
    { q: t('AiShowcase.faq_q2'), a: t('AiShowcase.faq_a2') },
    { q: t('AiShowcase.faq_q3'), a: t('AiShowcase.faq_a3') },
    { q: t('AiShowcase.faq_q4'), a: t('AiShowcase.faq_a4') },
  ];

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center">
          <Reveal variant="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <HelpCircle className="size-3.5" />
              <span>AI Guidance FAQ</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {t('AiShowcase.faq_title')}
            </h2>
          </Reveal>
        </div>

        <div className="mt-10 space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Reveal key={idx} variant="fade-up" delay={idx * 80}>
                <div
                  className={cn(
                    'rounded-2xl border transition-all duration-200 overflow-hidden',
                    isOpen
                      ? 'border-primary/50 bg-card shadow-md'
                      : 'border-border/60 bg-card/60 hover:border-border/80',
                  )}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left font-semibold text-foreground text-sm sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'size-5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2',
                        isOpen && 'rotate-180 text-primary',
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-muted-foreground border-t border-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
