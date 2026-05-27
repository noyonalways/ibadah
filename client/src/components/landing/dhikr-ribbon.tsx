import { Reveal } from '@/components/shared/reveal';

/**
 * A continuously-scrolling ribbon of dhikr phrases, rendered in Amiri.
 * Pure decorative break between dense content sections. The marquee
 * is paused on hover so visitors can read individual phrases.
 *
 * Built with two duplicated rows so the loop reads as continuous motion
 * (the classic CSS marquee technique — translate by -50% then snap back).
 */
export function DhikrRibbon() {
  const PHRASES = [
    'سُبْحَانَ ٱللَّٰه',
    'ٱلْحَمْدُ لِلَّٰه',
    'ٱللَّٰهُ أَكْبَر',
    'لَا إِلٰهَ إِلَّا ٱللَّٰه',
    'أَسْتَغْفِرُ ٱللَّٰه',
    'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰه',
    'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّد',
    'حَسْبُنَا ٱللَّٰهُ وَنِعْمَ ٱلْوَكِيل',
  ];

  // Render the phrases twice so the loop is seamless.
  const row = [...PHRASES, ...PHRASES];

  return (
    <section aria-hidden className="relative py-12 md:py-20">
      <Reveal variant="fade-in">
        <div className="marquee-mask relative overflow-hidden">
          <ul
            className="marquee-track gap-12 whitespace-nowrap"
            // The marquee is decorative; reading order is not meaningful
          >
            {row.map((phrase, i) => (
              <li
                key={i}
                className="font-display flex items-center gap-12 text-3xl leading-none text-primary/55 dark:text-primary/65 md:text-4xl"
                dir="rtl"
                lang="ar"
              >
                <span className="size-1.5 rounded-full bg-accent/60" aria-hidden />
                {phrase}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
