import { Sun, Sunrise, Sunset, Moon, MoonStar } from 'lucide-react';
import { IslamicDivider } from '@/components/shared/islamic-divider';

/**
 * The five daily prayers, presented as a "stations of the day" visual —
 * each with its own color mood and a soft, glassy card. This is one of
 * the moments that makes Ibadah feel different from a generic dashboard.
 */
const STATIONS = [
  { name: 'Fajr', meaning: 'Dawn', icon: Sunrise, gradient: 'bg-prayer-fajr' },
  { name: 'Dhuhr', meaning: 'Midday', icon: Sun, gradient: 'bg-prayer-dhuhr' },
  { name: 'Asr', meaning: 'Afternoon', icon: Sun, gradient: 'bg-prayer-asr' },
  { name: 'Maghrib', meaning: 'Sunset', icon: Sunset, gradient: 'bg-prayer-maghrib' },
  { name: 'Isha', meaning: 'Night', icon: MoonStar, gradient: 'bg-prayer-isha' },
];

export function Pillars() {
  return (
    <section id="pillars" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-aurora-soft" aria-hidden />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Moon className="size-3.5 text-primary" />
            Five stations of every day
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
            From <span className="text-gradient">dawn</span> to <span className="text-gradient">midnight</span> — one rhythm.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
            Each prayer carries its own light. Track them with care, earn bonuses for Sunnah, Nafil, and Witr — and watch your weeks compound.
          </p>
        </div>

        {/* Five station cards in a flowing row */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {STATIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="group relative overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-primary/10 transition-transform duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`relative h-44 ${s.gradient} p-5 text-white`}>
                  {/* subtle pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0px, transparent 1.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0px, transparent 1.5px)',
                      backgroundSize: '24px 24px',
                    }}
                    aria-hidden
                  />
                  {/* inner glow on hover */}
                  <div className="absolute -bottom-10 -right-10 size-32 rounded-full bg-white/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex h-full flex-col justify-between">
                    <Icon className="size-5 opacity-90" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] opacity-80">
                        {s.meaning}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">{s.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <IslamicDivider className="mx-auto mt-16 max-w-md" />
      </div>
    </section>
  );
}
