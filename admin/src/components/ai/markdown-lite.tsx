'use client';

import { useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tiny zero-dependency markdown renderer. Supports:
 *
 *   - Paragraphs separated by blank lines
 *   - `#`/`##`/`###` headings
 *   - Bullet lists (`-`, `*`)
 *   - Ordered lists (`1.`)
 *   - Inline `**bold**`, `*italic*`, `` `code` ``
 *   - Fenced ``` code blocks ```
 *   - `[link text](url)` links (rendered with `rel="noopener"`)
 *
 * We don't pull in `react-markdown` because the chat content is small
 * and we don't want to ship 50 KB of HTML-AST tooling for it. Anything
 * unsupported is rendered as plain text — never executed.
 */
interface MarkdownLiteProps {
  content: string;
  className?: string;
}

export function MarkdownLite({ content, className }: MarkdownLiteProps) {
  const blocks = useMemo(() => splitBlocks(content), [content]);
  return (
    <div className={cn('space-y-2 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2', className)}>
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; lang?: string; code: string };

function splitBlocks(input: string): Block[] {
  const blocks: Block[] = [];
  const lines = input.replace(/\r\n/g, '\n').split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip.
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Fenced code block.
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || undefined;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      // Skip the closing fence (if present).
      if (i < lines.length) i += 1;
      blocks.push({ kind: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Heading.
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }

    // Unordered list.
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph — accumulate until a blank line or block boundary.
    const paragraph: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

function isBlockStart(line: string): boolean {
  return (
    /^```/.test(line) ||
    /^#{1,3}\s+/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line)
  );
}

function Block({ block }: { block: Block }) {
  if (block.kind === 'heading') {
    const cls =
      block.level === 1
        ? 'text-base font-semibold'
        : block.level === 2
          ? 'text-sm font-semibold'
          : 'text-sm font-medium';
    return <p className={cls}>{renderInline(block.text)}</p>;
  }
  if (block.kind === 'ul') {
    return (
      <ul className="list-disc space-y-1 ps-5 marker:text-muted-foreground">
        {block.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === 'ol') {
    return (
      <ol className="list-decimal space-y-1 ps-5 marker:text-muted-foreground">
        {block.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ol>
    );
  }
  if (block.kind === 'code') {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 text-xs font-mono text-foreground/90">
        <code>{block.code}</code>
      </pre>
    );
  }
  return <p className="text-foreground/90">{renderInline(block.text)}</p>;
}

/**
 * Inline tokenizer for `**bold**`, `*italic*`, `` `code` ``, and
 * `[label](url)`. Escapes everything else so we never render arbitrary
 * HTML.
 */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < text.length) {
    // Inline code
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        out.push(
          <code
            key={key++}
            className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[0.85em]"
          >
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }

    // Bold
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        out.push(<strong key={key++}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }

    // Italic (single asterisk or underscore — keep it simple)
    if (text[i] === '*' || text[i] === '_') {
      const ch = text[i];
      const end = text.indexOf(ch, i + 1);
      if (end !== -1 && end > i + 1) {
        out.push(<em key={key++}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }

    // Link
    if (text[i] === '[') {
      const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(text.slice(i));
      if (linkMatch) {
        out.push(
          <a
            key={key++}
            href={linkMatch[2]}
            rel="noopener noreferrer"
            target="_blank"
            className="text-primary underline-offset-2 hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
        i += linkMatch[0].length;
        continue;
      }
    }

    // Plain text run — accumulate until next special char.
    const next = text.slice(i).search(/[`*_[]/);
    if (next === -1) {
      out.push(<span key={key++}>{text.slice(i)}</span>);
      break;
    }
    if (next === 0) {
      // The special char didn't open a valid token; emit it literally.
      out.push(<span key={key++}>{text[i]}</span>);
      i += 1;
    } else {
      out.push(<span key={key++}>{text.slice(i, i + next)}</span>);
      i += next;
    }
  }

  return out;
}
