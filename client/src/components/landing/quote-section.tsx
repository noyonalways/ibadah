import { useTranslations } from 'next-intl';
import { IslamicDivider } from '@/components/shared/islamic-divider';

/**
 * A still moment — the Quranic verse rendered with care. No backdrop or
 * orbs of its own; the page-level MarketingBackdrop carries the gradient
 * so transitions between sections are seamless.
 */
export function QuoteSection() {
  const t = useTranslations('Landing');

  return (
    <section id="verse" className="relative py-24 md:py-32">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="font-display text-[clamp(1.6rem,4.5vw,3.4rem)] leading-[1.6] text-foreground/90"
            dir="rtl"
            lang="ar"
          >
            أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ
          </p>

          <IslamicDivider className="mx-auto mt-8 max-w-xs" />

          <p className="mt-8 text-pretty text-lg italic leading-relaxed text-muted-foreground md:text-xl">
            &ldquo;{t('verse_main')}&rdquo;
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.22em] text-muted-foreground/70">
            {t('verse_main_cite')}
          </p>
        </div>
      </div>
    </section>
  );
}
