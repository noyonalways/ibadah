import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GeometricPattern } from '@/components/shared/geometric-pattern';

export function ComingSoon({ items }: { items: string[] }) {
  const t = useTranslations('Common');

  return (
    <Card className="relative overflow-hidden border-dashed border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
      <GeometricPattern className="text-primary" opacity={0.04} />
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />
      <CardContent className="relative flex flex-col items-start gap-5 p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 px-3.5 py-1 text-xs font-medium text-foreground/80 ring-1 ring-inset ring-accent/30">
          <Sparkles className="size-3.5 text-accent-deep" />
          {t('comingSoon')}
        </span>
        <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
