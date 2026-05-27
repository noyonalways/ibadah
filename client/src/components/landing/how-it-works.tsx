import { useTranslations } from 'next-intl';
import { Compass, Heart, LineChart } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

/**
 * Three-step explainer — Niyyah → Track → Reflect. The phrasing follows
 * an Islamic frame: intention, action, reflection.
 */
export function HowItWorks() {
  const t = useTranslations('Landing');

  const STEPS = [
    {
      step: '01',
      icon: Compass,
      titleKey: 'how_step1_title',
      descKey: 'how_step1_desc',
      tone: 'from-primary/30 to-primary/0',
      iconTone: 'bg-primary/15 text-primary ring-primary/20',
    },
    {
      step: '02',
      icon: Heart,
      titleKey: 'how_step2_title',
      descKey: 'how_step2_desc',
      tone: 'from-accent/30 to-accent/0',
      iconTone: 'bg-accent/30 text-accent-foreground ring-accent/40',
    },
    {
      step: '03',
      icon: LineChart,
      titleKey: 'how_step3_title',
      descKey: 'how_step3_desc',
      tone: 'from-tertiary/30 to-tertiary/0',
      iconTone: 'bg-tertiary/15 text-tertiary ring-tertiary/25',
    },
  ] as const;

  return (
    <section id="how" className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {t('how_eyebrow')}
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {t('how_title_1')} <span className="text-gradient">{t('how_title_2')}</span>{' '}
              {t('how_title_3')}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">{t('how_subtitle')}</p>
          </div>
        </Reveal>

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ step, icon: Icon, titleKey, descKey, tone, iconTone }, i) => (
            <Reveal key={step} delay={i * 120}>
              <li className="lift-hover relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-7 backdrop-blur">
                <div
                  className={`pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-gradient-to-br ${tone} blur-2xl`}
                  aria-hidden
                />
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-12 place-items-center rounded-xl ring-1 ring-inset ${iconTone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-3xl font-bold text-muted-foreground/40">
                    {step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {t(titleKey)}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {t(descKey)}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
