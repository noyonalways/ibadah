'use client';

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIComposerProps {
  onSubmit: (text: string) => void;
  onAbort?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
  /** Auto-focus on mount. Skip on the marketing widget so it doesn't steal focus from the page. */
  autoFocus?: boolean;
  /** Optional helper line below the input (e.g. provider hints). */
  hint?: string;
}

/**
 * The chat input bar. Handles:
 *  - Auto-resizing textarea (up to 5 lines).
 *  - Submit on Enter, newline on Shift+Enter.
 *  - Send button morphs into a Stop button while streaming.
 */
export function AIComposer({
  onSubmit,
  onAbort,
  isStreaming = false,
  placeholder = 'Ask anything…',
  className,
  autoFocus = false,
  hint,
}: AIComposerProps) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize: reset to auto so scrollHeight reflects the content,
  // then clamp to 5 rows.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 24 * 5; // approx 5 lines @ 24px line-height
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onAbort?.();
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const empty = value.trim().length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-2xl border border-border/60 bg-card/90 p-2 shadow-sm backdrop-blur',
        'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30',
        'transition-colors',
        className,
      )}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            'flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-6 text-foreground outline-none',
            'placeholder:text-muted-foreground',
          )}
        />
        <Button
          type="submit"
          size="icon"
          aria-label={isStreaming ? 'Stop response' : 'Send message'}
          disabled={!isStreaming && empty}
          className={cn(
            'size-9 shrink-0 rounded-full transition-all',
            isStreaming
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-gradient-to-br from-primary to-accent-deep shadow-sm shadow-primary/30 hover:shadow-primary/50',
          )}
        >
          {isStreaming ? <Square className="size-3.5 fill-current" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>
      {hint && (
        <p className="px-2 pb-0.5 pt-1 text-[10px] text-muted-foreground">{hint}</p>
      )}
    </form>
  );
}
