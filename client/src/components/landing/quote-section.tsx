import { GlowOrbs } from '@/components/shared/glow-orbs';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { IslamicDivider } from '@/components/shared/islamic-divider';

/**
 * A still moment — a Quranic verse rendered with care. Uses the display
 * font for the Arabic, with quiet typography for the translation and
 * citation. Designed to feel like a printed page, not a card.
 */
export function QuoteSection() {
  return (
    <section id="verse" className="relative overflow-hidden border-y border-border/40 py-28 md:py-36">
      <GlowOrbs variant="twilight" />
      <GeometricPattern className="text-tertiary" opacity={0.06} />

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
            &ldquo;Verily, in the remembrance of Allah do hearts find rest.&rdquo;
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.22em] text-muted-foreground/70">
            Surah Ar-Ra&apos;d · 13:28
          </p>
        </div>
      </div>
    </section>
  );
}
