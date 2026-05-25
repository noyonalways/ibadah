import { ArrowUpRight, BookOpen, CheckCircle2, HandHeart, ListChecks, ListTodo } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ACTIONS = [
  {
    href: '/salah' as const,
    label: 'Log prayers',
    desc: '5 daily + Witr',
    icon: CheckCircle2,
    accent: 'text-primary bg-primary/10',
  },
  {
    href: '/quran' as const,
    label: 'Quran reading',
    desc: 'Pages or minutes',
    icon: BookOpen,
    accent: 'text-accent-foreground bg-accent/30',
  },
  {
    href: '/dhikr' as const,
    label: 'Dhikr',
    desc: 'Tap to count',
    icon: HandHeart,
    accent: 'text-tertiary bg-tertiary/15',
  },
  {
    href: '/habits' as const,
    label: 'Habits',
    desc: 'Custom rewards',
    icon: ListChecks,
    accent: 'text-primary bg-primary/10',
  },
  {
    href: '/checklist' as const,
    label: 'Checklist',
    desc: 'Today\u2019s tasks',
    icon: ListTodo,
    accent: 'text-accent-foreground bg-accent/30',
  },
];

export function QuickActions() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Quick actions
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
                <p className="text-sm font-medium leading-none">{a.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
