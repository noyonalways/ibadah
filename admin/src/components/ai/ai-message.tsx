'use client';

import { Check, Loader2, Sparkles, User, Wrench, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ToolActivity } from '@/lib/ai/types';
import { parseChartsFromText } from '@/lib/ai/parse-chart';
import { MarkdownLite } from './markdown-lite';
import { AIChartRenderer } from './ai-chart-renderer';

/** camelCase tool name → human label, e.g. `getUserStats` → "User stats". */
function humanizeTool(name: string): string {
  const spaced = name
    .replace(/^get/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1) || name;
}

function ToolActivityStrip({ tools }: { tools: ToolActivity[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tools.map((tool, i) => (
        <span
          key={`${tool.name}-${i}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            tool.status === 'error'
              ? 'border-destructive/40 bg-destructive/5 text-destructive'
              : 'border-border/50 bg-muted/40 text-muted-foreground',
          )}
        >
          {tool.status === 'running' ? (
            <Loader2 className="size-3 animate-spin" />
          ) : tool.status === 'error' ? (
            <X className="size-3" />
          ) : (
            <Check className="size-3" />
          )}
          <Wrench className="size-2.5 opacity-60" />
          {humanizeTool(tool.name)}
        </span>
      ))}
    </div>
  );
}

interface AIMessageProps {
  message: ChatMessage;
  /** While the assistant is mid-stream, suppress chart parsing so a half-emitted JSON block doesn't render every keystroke. */
  isStreaming?: boolean;
}

/**
 * One row in the chat transcript. The user's bubble sits flush right;
 * the assistant's bubble is borderless and inline with the avatar so
 * the conversation reads like a chat thread, not a form log.
 */
export function AIMessage({ message, isStreaming }: AIMessageProps) {
  const isUser = message.role === 'user';

  // Mid-stream we just render the text — chart fences are usually
  // mid-emission JSON that wouldn't parse anyway. Once finalize() has
  // attached `charts`, we use that. As a fallback, we re-parse on the
  // fly if the message has no `charts` field but the content does
  // contain a fence (handles older messages stored before parsing).
  const { text, charts } = (() => {
    if (isStreaming || isUser) return { text: message.content, charts: [] as typeof message.charts };
    if (message.charts && message.charts.length > 0) {
      // Attempt to strip fences for display while reusing the
      // pre-parsed charts.
      const parsed = parseChartsFromText(message.content);
      return { text: parsed.text || message.content, charts: message.charts };
    }
    if (message.content.includes('```chart')) {
      const parsed = parseChartsFromText(message.content);
      return { text: parsed.text, charts: parsed.charts };
    }
    return { text: message.content, charts: [] as typeof message.charts };
  })();

  return (
    <div
      className={cn(
        'flex w-full gap-2.5',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div
          className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent-deep text-white shadow-sm"
          aria-hidden
        >
          <Sparkles className="size-3.5" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[88%] min-w-0 space-y-2 rounded-2xl px-3.5 py-2.5',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground shadow-sm'
            : 'rounded-bl-md bg-muted/40 text-foreground border border-border/40',
        )}
      >
        {!isUser && message.tools && message.tools.length > 0 && (
          <ToolActivityStrip tools={message.tools} />
        )}

        {text ? (
          <MarkdownLite content={text} />
        ) : isStreaming && !isUser ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground" aria-live="polite">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </span>
        ) : null}

        {!isUser && charts && charts.length > 0 && (
          <div className="space-y-3">
            {charts.map((spec, i) => (
              <AIChartRenderer key={i} spec={spec} />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="grid size-7 shrink-0 place-items-center rounded-full border border-border/60 bg-card text-muted-foreground"
          aria-hidden
        >
          <User className="size-3.5" />
        </div>
      )}
    </div>
  );
}
