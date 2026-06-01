'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Sparkles } from 'lucide-react';

import { AIMessage } from './ai-message';
import { AIComposer } from './ai-composer';
import { useAiChat } from '@/hooks/use-ai-chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AIPanelProps {
  greeting?: string;
  surface?: 'landing' | 'dashboard' | 'admin';
  buildContext?: () => string | undefined;
  /** Visible suggestion chips above the composer. */
  suggestions?: string[];
  /** Override the chat endpoint. Defaults to `/api/ai/chat`. */
  endpoint?: string;
  /** Compact spacing for the floating widget. The full-page assistant uses `comfortable`. */
  density?: 'compact' | 'comfortable';
  /** Auto-focus the composer on mount. */
  autoFocus?: boolean;
  className?: string;
  /** Hint shown under the composer (e.g. "Powered by OpenRouter"). */
  hint?: string;
}

/**
 * The chat surface. Used both inside the floating widget sheet and on
 * the dedicated `/assistant` page. Keeping the panel headless means
 * both call-sites get the same scrolling, suggestions, and accessibility
 * behavior for free.
 */
export function AIPanel({
  greeting = "Assalamu alaikum. I'm your Ibadah assistant — ask me about Salah scoring, tracking habits, or share your week and I can chart it for you.",
  surface = 'dashboard',
  buildContext,
  suggestions,
  endpoint,
  density = 'comfortable',
  autoFocus = false,
  className,
  hint,
}: AIPanelProps) {
  const chat = useAiChat({ greeting, surface, buildContext, endpoint });
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever messages change. Use a
  // MutationObserver-style effect: depend on the *length* and on the
  // last message's content so streaming deltas keep us pinned at the
  // bottom only if the user hasn't scrolled away.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    if (distanceFromBottom < 120) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [chat.messages]);

  const lastMessageId = chat.messages[chat.messages.length - 1]?.id;

  // Render the assistant placeholder differently while it's streaming.
  const tagged = useMemo(
    () =>
      chat.messages.map((m) => ({
        ...m,
        // Mark the most recent assistant message as streaming if the
        // hook says so AND it's currently empty / mid-stream.
        _streaming: chat.isStreaming && m.id === lastMessageId && m.role === 'assistant',
      })),
    [chat.messages, chat.isStreaming, lastMessageId],
  );

  const padding = density === 'compact' ? 'px-3 py-3' : 'px-4 py-4 sm:px-6';
  const gap = density === 'compact' ? 'space-y-3' : 'space-y-4';

  const visibleSuggestions = suggestions && chat.messages.length <= 1 ? suggestions : [];

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div ref={scrollerRef} className={cn('flex-1 overflow-y-auto overscroll-contain', padding, gap)}>
        {chat.messages.length === 0 ? (
          <EmptyState />
        ) : (
          tagged.map((m) => (
            <AIMessage key={m.id} message={m} isStreaming={m._streaming} />
          ))
        )}
        {chat.error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {chat.error}
          </p>
        )}
      </div>

      {visibleSuggestions.length > 0 && (
        <div className={cn('flex flex-wrap gap-2 px-3 pb-2 sm:px-6')}>
          {visibleSuggestions.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              type="button"
              onClick={() => chat.send(s)}
              disabled={chat.isStreaming}
              className="h-7 rounded-full bg-card/60 px-3 text-xs font-normal"
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      <div className={cn('border-t border-border/40 bg-background/60 px-3 py-3 backdrop-blur sm:px-4')}>
        <AIComposer
          onSubmit={chat.send}
          onAbort={chat.abort}
          isStreaming={chat.isStreaming}
          autoFocus={autoFocus}
          hint={hint ?? 'Press Enter to send · Shift+Enter for newline'}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center px-6 py-12 text-center">
      <div>
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
          <Sparkles className="size-6" />
        </div>
        <p className="text-sm font-medium">Ask me anything about Ibadah</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Salah scoring, habit tracking, or paste your stats and I&rsquo;ll visualize them.
        </p>
      </div>
    </div>
  );
}
