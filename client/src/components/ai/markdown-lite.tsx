'use client';

import { memo, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

/**
 * Production-grade markdown renderer for AI responses.
 *
 * Built on `react-markdown` + `remark-gfm`, so we get the full
 * CommonMark + GitHub-Flavored-Markdown surface:
 *
 *   - Headings (h1–h6), paragraphs, line breaks
 *   - **bold**, *italic*, ~~strikethrough~~, `inline code`
 *   - Fenced/indented code blocks
 *   - Ordered, unordered, and nested lists
 *   - Task lists (`- [ ]` / `- [x]`)
 *   - Tables (with horizontal scroll on overflow)
 *   - Blockquotes, horizontal rules
 *   - Autolinks and `[label](url)` links (opened safely in a new tab)
 *
 * Raw HTML in the markdown source is NOT rendered (we don't add
 * `rehype-raw`), so model output can never inject arbitrary markup —
 * everything is escaped to text. This keeps the surface XSS-safe.
 */
interface MarkdownLiteProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ className, ...props }) => (
    <h1 className={cn('mt-4 mb-2 text-lg font-semibold tracking-tight first:mt-0', className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn('mt-4 mb-2 text-base font-semibold tracking-tight first:mt-0', className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn('mt-3 mb-1.5 text-sm font-semibold first:mt-0', className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn('mt-3 mb-1.5 text-sm font-medium first:mt-0', className)} {...props} />
  ),
  h5: ({ className, ...props }) => (
    <h5 className={cn('mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0', className)} {...props} />
  ),
  h6: ({ className, ...props }) => (
    <h6 className={cn('mt-2 mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0', className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn('text-foreground/90 not-first:mt-2', className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn('font-medium text-primary underline underline-offset-2 hover:opacity-80', className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: ({ className, ...props }) => <strong className={cn('font-semibold', className)} {...props} />,
  em: ({ className, ...props }) => <em className={cn('italic', className)} {...props} />,
  del: ({ className, ...props }) => <del className={cn('line-through opacity-70', className)} {...props} />,
  ul: ({ className, ...props }) => (
    <ul className={cn('my-2 ms-1 list-disc space-y-1 ps-4 marker:text-muted-foreground', className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn('my-2 ms-1 list-decimal space-y-1 ps-4 marker:text-muted-foreground', className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn('leading-relaxed [&>ul]:my-1 [&>ol]:my-1', className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn('my-2 border-s-2 border-primary/40 ps-3 text-foreground/80 italic', className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => <hr className={cn('my-3 border-border/60', className)} {...props} />,
  code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
    // `react-markdown` v10 renders inline code as a bare <code>; block
    // code arrives wrapped in <pre>. We detect a block by the presence
    // of a language class or a newline in the content.
    const isBlock = /language-/.test(className ?? '') || String(children).includes('\n');
    if (isBlock) {
      return (
        <code className={cn('font-mono text-xs leading-relaxed', className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn('rounded bg-muted/60 px-1 py-0.5 font-mono text-[0.85em]', className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        'my-2 overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 text-foreground/90',
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-2 w-full overflow-x-auto rounded-lg border border-border/60">
      <table className={cn('w-full border-collapse text-xs', className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => <thead className={cn('bg-muted/50', className)} {...props} />,
  tr: ({ className, ...props }) => <tr className={cn('border-b border-border/40 last:border-0', className)} {...props} />,
  th: ({ className, ...props }) => (
    <th className={cn('px-3 py-2 text-start font-semibold', className)} {...props} />
  ),
  td: ({ className, ...props }) => <td className={cn('px-3 py-2 align-top', className)} {...props} />,
  img: ({ className, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img className={cn('my-2 max-w-full rounded-lg border border-border/60', className)} {...props} />
  ),
};

function MarkdownLiteImpl({ content, className }: MarkdownLiteProps) {
  return (
    <div className={cn('text-sm leading-relaxed wrap-break-word', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Memoized so streaming deltas only re-render when the text actually
 * changes (the parent re-renders the whole transcript on each chunk).
 */
export const MarkdownLite = memo(MarkdownLiteImpl);
