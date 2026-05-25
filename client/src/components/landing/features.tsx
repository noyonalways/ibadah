import { useTranslations } from 'next-intl';
import {
  BookOpen,
  CheckCircle2,
  ListChecks,
  LineChart,
  HandHeart,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FEATURES = [
  { key: 'salah', icon: CheckCircle2 },
  { key: 'quran', icon: BookOpen },
  { key: 'dhikr', icon: HandHeart },
  { key: 'habits', icon: ListChecks },
  { key: 'checklist', icon: Sparkles },
  { key: 'visuals', icon: LineChart },
] as const;

export function Features() {
  const t = useTranslations('Landing');

  return (
    <section id="features" className="border-b border-border/50">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('featuresTitle')}</h2>
          <p className="mt-3 text-muted-foreground">{t('featuresSubtitle')}</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <Card
              key={key}
              className="group relative overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="mt-4 text-lg">{t(`feature_${key}_title`)}</CardTitle>
                <CardDescription className="text-pretty">
                  {t(`feature_${key}_desc`)}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
