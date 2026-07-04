import { useTranslations } from 'next-intl';
import { IslamicDivider } from '@/components/shared/islamic-divider';
import { Reveal } from '@/components/shared/reveal';
import { LandingCard } from '@/components/landing/landing-card';
import { LandingSection } from '@/components/landing/landing-section';

export function QuoteSection() {
  const t = useTranslations('Landing');

  return (
    <LandingSection id="verse" divider>
      <Reveal variant="scale-in">
        <LandingCard interactive={false} className="mx-auto max-w-3xl px-8 py-12 md:px-14 md:py-16">
          <div className="text-center">
            <Reveal variant="blur-up" delay={100}>
              <p
                className="font-display text-[clamp(1.5rem,3.5vw,2.75rem)] leading-[1.6] text-foreground/90"
                dir="rtl"
                lang="ar"
              >
                أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ
              </p>
            </Reveal>

            <Reveal variant="blur-up" delay={180}>
              <IslamicDivider className="mx-auto mt-7 max-w-xs" />
            </Reveal>

            <Reveal variant="blur-up" delay={260}>
              <p className="mt-7 text-pretty text-lg italic leading-relaxed text-muted-foreground">
                &ldquo;{t('verse_main')}&rdquo;
              </p>
            </Reveal>

            <Reveal variant="blur-up" delay={320}>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted-foreground/70">
                {t('verse_main_cite')}
              </p>
            </Reveal>
          </div>
        </LandingCard>
      </Reveal>
    </LandingSection>
  );
}
