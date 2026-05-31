/**
 * Extracts ChartSpec objects from a streamed assistant message. Same
 * logic as the client copy — kept here so the admin app can render
 * charts even if the workspaces are split out later.
 */
import type { ChartSpec } from './types';

const CHART_FENCE_RE = /```chart\s*\n([\s\S]*?)\n```/g;

export interface ParsedMessage {
  text: string;
  charts: ChartSpec[];
}

export function parseChartsFromText(content: string): ParsedMessage {
  const charts: ChartSpec[] = [];
  let match: RegExpExecArray | null;
  const failedRanges: Array<[number, number]> = [];

  const re = new RegExp(CHART_FENCE_RE.source, CHART_FENCE_RE.flags);
  while ((match = re.exec(content)) !== null) {
    const raw = match[1];
    const spec = safeParseChart(raw);
    if (spec) {
      charts.push(spec);
    } else {
      failedRanges.push([match.index, match.index + match[0].length]);
    }
  }

  let cleaned = content.replace(re, (full, _body, offset: number) => {
    const isFailed = failedRanges.some(([s, e]) => offset >= s && offset < e);
    return isFailed ? full : '';
  });
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
