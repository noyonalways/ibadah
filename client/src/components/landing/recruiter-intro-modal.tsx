'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Github,
  Globe,
  Layers,
  Linkedin,
  Loader2,
  LogIn,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandMark } from '@/components/shared/brand-mark';
import { Link, useRouter } from '@/i18n/routing';
import { useLogin } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { PublicRecruiterIntro } from '@/lib/site-config-api';

interface RecruiterIntroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: PublicRecruiterIntro;
}

type TabId = 'purpose' | 'stack' | 'demo' | 'links';

export function RecruiterIntroModal({
  open,
  onOpenChange,
  config,
}: RecruiterIntroModalProps) {
  const router = useRouter();
  const loginMutation = useLogin();
  const [activeTab, setActiveTab] = useState<TabId>('purpose');
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const authorName = config.authorName?.trim() || 'Noyon';
  const githubUrl = config.githubUrl?.trim() || 'https://github.com/noyonalways/ibadah';
  const hasDemo = Boolean(config.demoEmail?.trim() && config.demoPassword?.trim());

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'purpose', label: 'Why Ibadah?', icon: <CompassIcon className="size-3.5" /> },
    { id: 'stack',   label: 'Tech Stack',  icon: <Code2 className="size-3.5" /> },
    ...(hasDemo ? [{ id: 'demo' as TabId, label: 'Live Demo', icon: <LogIn className="size-3.5" /> }] : []),
    { id: 'links',   label: 'Links & Code', icon: <Layers className="size-3.5" /> },
  ];

  const handleCopy = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field === 'email' ? 'Demo email' : 'Password'} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleDemoLogin = async () => {
    if (!config.demoEmail || !config.demoPassword) return;
    try {
      await loginMutation.mutateAsync({
        email: config.demoEmail,
        password: config.demoPassword,
      });
      toast.success('Logged in as demo user! Redirecting to dashboard...');
      onOpenChange(false);
      router.push('/dashboard');
    } catch (err) {
      toast.error((err as Error)?.message || 'Demo login failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[95vw] max-w-2xl overflow-hidden p-0 sm:max-h-[88dvh] sm:rounded-3xl border border-primary/20 bg-background/95 backdrop-blur-2xl shadow-2xl flex flex-col">
        {/* Decorative ambient gradient */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden opacity-60"
          aria-hidden
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 size-72 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
        </div>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative shrink-0 border-b border-border/60 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
              <BrandMark size={28} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="text-[10px] tracking-wider uppercase font-semibold">
                  <Sparkles className="mr-1 size-3" /> Recruiter &amp; Architecture Brief
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Built by <strong className="text-foreground font-semibold">{authorName}</strong>
                </span>
              </div>
              <DialogTitle className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
                Ibadah — Journey Towards Allah
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            A production-grade, full-stack Islamic worship and habit tracking platform designed with
            modern software engineering principles, high-performance architecture, and polished UX.
          </DialogDescription>
        </div>

        {/* ── Custom Tab Bar ──────────────────────────────────── */}
        <div className="shrink-0 border-b border-border/60 bg-muted/30 px-4 sm:px-5">
          <div
            role="tablist"
            aria-label="Modal sections"
            className="flex items-center gap-1 overflow-x-auto scrollbar-none"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors duration-150 outline-none select-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 rounded-sm',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground/80',
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {/* active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Panels ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm">

          {/* ── Purpose ── */}
          {activeTab === 'purpose' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="size-4" /> Core Mission &amp; Problem Solved
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Most Islamic apps are siloed—one app for prayer times, another for Quran reading,
                  and another for Dhikr counters.{' '}
                  <strong>Ibadah unifies worship into one cohesive journey</strong> with gamified
                  progression, Hanafi waqt scoring, daily heatmaps, streak calculation, and AI
                  guidance.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: <CheckCircle2 className="size-4" />,
                    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                    title: 'Salah Waqt Engine',
                    desc: 'Tracks 5 daily prayers across time windows (Awwal +30, Mid +20, Last +10, Missed -10) with Sunnah, Nafl, and Friday Jummah reward multipliers.',
                  },
                  {
                    icon: <BookOpenIcon className="size-4" />,
                    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                    title: 'Quran & Dhikr Logs',
                    desc: 'Page-level Quran logs with reading time, along with an interactive multi-preset Tasbeeh/Dhikr counter tracking daily targets.',
                  },
                  {
                    icon: <Layers className="size-4" />,
                    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                    title: 'Atomic Habits & Checklists',
                    desc: 'Custom daily spiritual checklists and atomic habits with streak calculation, reward points, and personalized reminders.',
                  },
                  {
                    icon: <Globe className="size-4" />,
                    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
                    title: 'i18n & RTL Ready',
                    desc: 'Full internationalization via next-intl in English, Bangla, and Arabic with true bidirectional Right-to-Left (RTL) styling.',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-border/60 bg-card/60 p-3.5 backdrop-blur"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('grid size-8 place-items-center rounded-lg', card.color)}>
                        {card.icon}
                      </span>
                      <h5 className="font-semibold text-xs sm:text-sm">{card.title}</h5>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tech Stack ── */}
          {activeTab === 'stack' && (
            <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in duration-200">
              {[
                {
                  icon: <Code2 className="size-4 text-primary" />,
                  title: 'Client App (client/)',
                  bullets: [
                    <><strong>Next.js 15</strong> (App Router) + <strong>React 19</strong></>,
                    <><strong>Tailwind CSS v4</strong> + shadcn/ui components</>,
                    <><strong>TanStack Query v5</strong> for server cache</>,
                    <><strong>Zustand v5</strong> for local reactive state</>,
                    <><strong>Recharts</strong> for progress &amp; streak visualizations</>,
                    <><strong>PWA</strong> with offline detection &amp; service worker</>,
                  ],
                },
                {
                  icon: <Terminal className="size-4 text-emerald-500" />,
                  title: 'Backend API (server/)',
                  bullets: [
                    <><strong>Node.js ≥ 20</strong> + <strong>Express 5</strong> (TypeScript)</>,
                    <><strong>MongoDB Atlas</strong> + <strong>Mongoose 8</strong></>,
                    <><strong>Feature-Folder Pattern</strong> (module-owned routes, controllers, services, models)</>,
                    <><strong>Zod 3</strong> strict runtime input validation</>,
                    <>Rate limiting, helmet, and structured logging</>,
                  ],
                },
                {
                  icon: <ShieldCheck className="size-4 text-blue-500" />,
                  title: 'Dual-Mode Auth',
                  bullets: [
                    <><strong>Web browser:</strong> Secure httpOnly JWT access &amp; refresh cookies</>,
                    <><strong>Mobile / API:</strong> Bearer tokens via x-client-type</>,
                    <>Transparent auto-refresh on 401</>,
                    <>Password hashing via <strong>bcryptjs</strong></>,
                    <>Google OAuth 2.0 integration ready</>,
                  ],
                },
                {
                  icon: <Cpu className="size-4 text-purple-500" />,
                  title: 'AI & Operations',
                  bullets: [
                    <><strong>Admin Console (admin/):</strong> Operations portal with analytics, user moderation, and audit trail</>,
                    <><strong>AI Assistant:</strong> Multi-provider LLM support (OpenRouter, Claude, GPT, Gemini) with tool calling</>,
                    <>Dynamic database-backed system configuration</>,
                  ],
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                    {card.icon} {card.title}
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {card.bullets.map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ── Live Demo ── */}
          {activeTab === 'demo' && hasDemo && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-5">
                <h4 className="font-semibold text-base flex items-center gap-2 text-foreground">
                  <Sparkles className="size-4 text-primary" /> Instant Demo Experience
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Explore the application as an active user with historical prayer logs, Quran
                  tracking, habit completions, and analytics.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Demo Email
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <code className="text-xs font-mono font-medium truncate">{config.demoEmail}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => handleCopy(config.demoEmail!, 'email')}
                        aria-label="Copy demo email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Demo Password
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <code className="text-xs font-mono font-medium truncate">{config.demoPassword}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => handleCopy(config.demoPassword!, 'password')}
                        aria-label="Copy demo password"
                      >
                        {copiedField === 'password' ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    size="lg"
                    className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary via-primary to-accent-deep font-semibold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    onClick={handleDemoLogin}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Logging into Demo...
                      </>
                    ) : (
                      <>
                        <LogIn className="size-4" /> 1-Click Demo Login &amp; Dashboard Tour
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Prefer a clean slate? You can also{' '}
                <Link
                  href="/register"
                  onClick={() => onOpenChange(false)}
                  className="text-primary underline font-medium"
                >
                  create a new account
                </Link>{' '}
                or continue exploring as a guest.
              </p>
            </div>
          )}

          {/* ── Links & Code ── */}
          {activeTab === 'links' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card/90"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                    <Github className="size-5" />
                  </span>
                  <div>
                    <h5 className="font-semibold text-sm">GitHub Repository</h5>
                    <p className="text-xs text-muted-foreground">
                      Browse the full source code, commit history, and README architecture diagrams
                    </p>
                  </div>
                </div>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              </a>

              {config.portfolioUrl?.trim() && (
                <a
                  href={config.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card/90"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Globe className="size-5" />
                    </span>
                    <div>
                      <h5 className="font-semibold text-sm">Developer Portfolio</h5>
                      <p className="text-xs text-muted-foreground">
                        View more projects and engineering case studies
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                </a>
              )}

              {config.linkedinUrl?.trim() && (
                <a
                  href={config.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card/90"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                      <Linkedin className="size-5" />
                    </span>
                    <div>
                      <h5 className="font-semibold text-sm">LinkedIn Profile</h5>
                      <p className="text-xs text-muted-foreground">
                        Connect with the author professionally
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                </a>
              )}

              <div className="pt-1 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/features" onClick={() => onOpenChange(false)}>
                    Features Overview
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/releases" onClick={() => onOpenChange(false)}>
                    Release Changelog
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/about" onClick={() => onOpenChange(false)}>
                    About Page
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border/60 bg-muted/20 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            Reopen anytime via the <strong className="text-foreground">Recruiter Brief</strong> button.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4"
            >
              Explore App
            </Button>
            {hasDemo && activeTab !== 'demo' && (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTab('demo')}
                className="rounded-xl bg-primary text-primary-foreground px-4 gap-1.5"
              >
                <LogIn className="size-3.5" />
                Try Demo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompassIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function BookOpenIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
