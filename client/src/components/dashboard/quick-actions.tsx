import { useTranslations } from 'next-intl';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  HandHeart,
  ListChecks,
  ListTodo,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionItem {
  href: '/salah' | '/quran' | '/dhikr' | '/habits' | '/checklist';
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  accent: string;
}

const ACTIONS: ActionItem[] = [
  {
    href: '/salah',
    labelKey: 'quick_log_prayers',
    descKey: 'quick_log_prayers_sub',
    icon: CheckCircle2,
    accent: 'text-primary bg-primary/10',
  },
  {
    href: '/quran',
    labelKey: 'quick_quran',
    descKey: 'quick_quran_sub',
    icon: BookOpen,
    accent: 'text-accent-foreground bg-accent/30',
  },
  {
    href: '/dhikr',
    labelKey: 'quick_dhikr',
    descKey: 'quick_dhikr_sub',
    icon: HandHeart,
    accent: 'text-tertiary bg-tertiary/15',
  },
  {
    href: '/habits',
    labelKey: 'quick_habits',
    descKey: 'quick_habits_sub',
    icon: ListChecks,
    accent: 'text-primary bg-primary/10',
  },
  {
    href: '/checklist',
    labelKey: 'quick_checklist',
    descKey: 'quick_checklist_sub',
    icon: ListTodo,
    accent: 'text-accent-foreground bg-accent/30',
  },
];

export function QuickActions() {
  const t = useTranslations('Dashboard');

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t('quick_actions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pb-5">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
            >
              <span className={`grid size-9 place-items-center rounded-lg ${a.accent}`}>
                <Icon className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{t(a.labelKey)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(a.descKey)}</p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
