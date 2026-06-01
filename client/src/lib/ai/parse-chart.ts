/**
 * Extracts ChartSpec objects from a streamed assistant message.
 *
 * The model is instructed (see `system-prompt.ts`) to emit charts as
 * fenced blocks tagged `chart`:
 *
 *   ```chart
 *   {"type":"bar","data":[...]}
 *   ```
 *
 * `parseChartsFromText` scans the message, returns the prose with the
 * fences stripped (so the renderer doesn't show the raw JSON), and a
 * list of successfully-parsed specs. Malformed JSON blocks are kept
 * inline as a code fence so the user still sees something useful and
 * we don't silently swallow them.
 */
import type { ChartSpec } from './types';

const CHART_FENCE_RE = /```chart\s*\n([\s\S]*?)\n```/g;

export interface ParsedMessage {
  /** Text with chart fences removed. May be empty if the message was only a chart. */
  text: string;
  charts: ChartSpec[];
}

export function parseChartsFromText(content: string): ParsedMessage {
  const charts: ChartSpec[] = [];
  let cleaned = content;
  let match: RegExpExecArray | null;
  const failedRanges: Array<[number, number]> = [];

  // We need a fresh regex per call to avoid lastIndex leaking.
  const re = new RegExp(CHART_FENCE_RE.source, CHART_FENCE_RE.flags);
  while ((match = re.exec(content)) !== null) {
    const raw = match[1];
    const spec = safeParseChart(raw);
    if (spec) {
      charts.push(spec);
    } else {
      // Remember the indices so we can leave the malformed fence in
      // place rather than silently deleting.
      failedRanges.push([match.index, match.index + match[0].length]);
    }
  }

  // Strip every successful chart fence from the displayed text.
  cleaned = content.replace(re, (full, _body, offset: number) => {
    const isFailed = failedRanges.some(([s, e]) => offset >= s && offset < e);
    return isFailed ? full : '';
  });

  // Collapse trailing whitespace and blank lines left behind.
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return { text: cleaned, charts };
}

function safeParseChart(raw: string): ChartSpec | null {
  try {
    const obj = JSON.parse(raw) as ChartSpec;
    if (!obj || typeof obj !== 'object') return null;
    if (!Array.isArray(obj.data)) return null;
    if (!obj.type) return null;
    if (!['bar', 'line', 'area', 'pie'].includes(obj.type)) return null;
    return obj;
  } catch {
    return null;
  }
}
