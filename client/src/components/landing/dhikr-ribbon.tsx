import { Reveal } from '@/components/shared/reveal';

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

  const row = [...PHRASES, ...PHRASES];

  return (
    <section aria-hidden className="relative py-10 md:py-14">
      <Reveal variant="fade-in">
        <div className="marquee-mask overflow-hidden border-y border-border/50 bg-card/30 py-5 backdrop-blur-sm">
          <ul className="marquee-track gap-10 whitespace-nowrap">
            {row.map((phrase, i) => (
              <li
                key={i}
                className="font-display flex items-center gap-10 text-2xl leading-none text-primary/50 md:text-3xl"
                dir="rtl"
                lang="ar"
              >
                <span className="size-1.5 rounded-full bg-primary/40" aria-hidden />
                {phrase}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
