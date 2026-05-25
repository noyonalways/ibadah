import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ComingSoon({ items }: { items: string[] }) {
  const t = useTranslations('Common');

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-4 p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3" />
          {t('comingSoon')}
        </span>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
