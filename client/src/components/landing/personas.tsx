import { useTranslations } from 'next-intl';
import { Sprout, Mountain, RotateCcw } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

/**
 * "For whom is Ibadah?" — three honest personas instead of fake
 * testimonials. Phrased as descriptions of the people the app is built
 * for, paired with specific ways the app helps them.
 */
export function Personas() {
  const t = useTranslations('Landing');

  const PEOPLE = [
    {
      key: 'beginner',
      icon: Sprout,
      tone: 'bg-prayer-fajr',
    },
    {
      key: 'consistent',
      icon: Mountain,
      tone: 'bg-prayer-dhuhr',
    },
    {
      key: 'returning',
      icon: RotateCcw,
      tone: 'bg-prayer-maghrib',
    },
  ] as const;

  return (
    <section id="for-you" className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {t('personas_eyebrow')}
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {t('personas_title_1')}{' '}
              <span className="text-gradient">{t('personas_title_2')}</span>
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              {t('personas_subtitle')}
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PEOPLE.map(({ key, icon: Icon, tone }, i) => (
            <Reveal key={key} delay={i * 120}>
              <article className="lift-hover group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur">
                {/* Top color band */}
                <div
                  className={`relative h-32 ${tone} overflow-hidden p-5 text-white`}
                >
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0px, transparent 1.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0px, transparent 1.5px)',
                      backgroundSize: '24px 24px',
                    }}
                    aria-hidden
                  />
                  <div className="relative flex h-full flex-col justify-between">
                    <Icon className="size-6 opacity-95" />
                    <p className="text-xs uppercase tracking-[0.22em] opacity-90">
                      {t(`persona_${key}_label`)}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {t(`persona_${key}_title`)}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {t(`persona_${key}_desc`)}
                  </p>

                  {/* "What helps" bullet — connects persona to features */}
                  <p className="mt-5 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/15">
                    {t(`persona_${key}_help`)}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
