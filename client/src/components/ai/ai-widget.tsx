'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

import { AIPanel } from './ai-panel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIWidgetProps {
  surface?: 'landing' | 'dashboard' | 'admin';
  /** Optional dynamic context generator (e.g. recent stats). */
  buildContext?: () => string | undefined;
  /** Suggestion chips shown when the panel is empty. */
  suggestions?: string[];
  /** Override the chat endpoint. */
  endpoint?: string;
  greeting?: string;
  /** Hint under the composer. */
  hint?: string;
  /**
   * Lift the launcher above a mobile bottom nav. Defaults to true so
   * the widget stays clear of the dashboard tab bar; set to false on
   * the marketing site or admin where there is no bottom nav.
   */
  liftAboveBottomNav?: boolean;
  /** Hide the launcher when true (useful on the dedicated /assistant page so the widget doesn't double up). */
  hidden?: boolean;
}

/**
 * Floating AI launcher + chat panel. Anchored to the bottom-right
 * (bottom-left under RTL) of the viewport, sits above the mobile
 * bottom nav, and slides up into a card-shaped sheet on click.
 *
 * The panel is intentionally fixed (not a Radix Dialog) so it can
 * coexist with the rest of the page chrome without trapping focus —
 * a chat assistant should never block the page it lives on.
 */
export function AIWidget({
  surface = 'dashboard',
  buildContext,
  suggestions,
  endpoint,
  greeting,
  hint,
  liftAboveBottomNav = true,
  hidden,
}: AIWidgetProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape when open. Mirrors a modal's keyboard contract
  // without locking focus inside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (hidden) return null;

  const launcherBottom = liftAboveBottomNav
    ? 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-6'
    : 'bottom-[calc(1rem+env(safe-area-inset-bottom))] lg:bottom-6';
  const panelBottom = liftAboveBottomNav
    ? 'bottom-[calc(9rem+env(safe-area-inset-bottom))] sm:bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-24'
    : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-24';

  return (
    <>
      {/* Launcher */}
      <Button
        type="button"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        aria-expanded={open}
        className={cn(
          'fixed z-40 size-12 rounded-full shadow-2xl transition-all',
          launcherBottom,
          'right-4 lg:right-6',
          'rtl:right-auto rtl:left-4 lg:rtl:left-6',
          'bg-gradient-to-br from-primary via-primary to-accent-deep',
          'shadow-primary/40 hover:shadow-primary/60 hover:scale-105',
          open && 'scale-95',
        )}
      >
        {open ? <X className="size-5" /> : <Sparkles className="size-5" />}
      </Button>

      {/* Backdrop — closes the panel on outside click. Only visible
          on small screens; on desktop the panel is detached. */}
      {open && (
        <button
          type="button"
          aria-label="Close assistant"
          className="fixed inset-0 z-30 cursor-default bg-background/30 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Ibadah assistant"
        aria-hidden={!open}
        className={cn(
          'fixed z-40 origin-bottom-right transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          panelBottom,
          'right-4 lg:right-6',
          'rtl:right-auto rtl:left-4 lg:rtl:left-6',
          'flex w-[calc(100vw-2rem)] max-w-md flex-col rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/10',
          'h-[min(70dvh,560px)] sm:h-[min(70dvh,560px)]',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100 scale-100'
            : 'pointer-events-none translate-y-2 opacity-0 scale-95',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent-deep text-white shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Ibadah assistant</p>
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Always here, in shā Allāh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1">
          <AIPanel
            surface={surface}
            buildContext={buildContext}
            suggestions={suggestions}
            endpoint={endpoint}
            density="compact"
            greeting={greeting}
            hint={hint}
            autoFocus={open}
            persistKey={`ibadah-chat-${surface}`}
          />
        </div>
      </div>
    </>
  );
}
