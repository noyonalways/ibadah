/**
 * Client AI API - connects to server AI endpoints
 */
import { authStorage } from './auth-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text?: string }
  | { type: 'error'; message: string }
  | { type: 'tool_call'; tool: string }
  | { type: 'tool_result'; tool: string; ok: boolean };

export interface ChatRequestBody {
  messages: { role: string; content: string }[];
  surface?: 'landing' | 'dashboard' | 'admin';
  context?: string;
}

/**
 * Stream chat with the AI assistant via server endpoint (admin surface)
 */
export async function* streamAdminChat(
  body: Omit<ChatRequestBody, 'surface'>,
  options: { signal?: AbortSignal } = {},
): AsyncIterable<StreamEvent> {
  const token = authStorage.getAccess();

  const res = await fetch(`${API_BASE}/ai/admin/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ ...body, surface: 'admin' }),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    let message = `Chat request failed (${res.status})`;
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      /* fallthrough */
    }
    yield { type: 'error', message };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = parseFrame(frame);
        if (event) yield event;
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const event = parseFrame(trailing);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream chat with the AI assistant via server endpoint
 */
export async function* streamClientChat(
  body: ChatRequestBody,
  options: { signal?: AbortSignal } = {},
): AsyncIterable<StreamEvent> {
  const token = authStorage.getAccess();

  const res = await fetch(`${API_BASE}/ai/client/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    let message = `Chat request failed (${res.status})`;
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      /* fallthrough */
    }
    yield { type: 'error', message };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = parseFrame(frame);
        if (event) yield event;
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const event = parseFrame(trailing);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(frame: string): StreamEvent | null {
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  try {
    const parsed = JSON.parse(dataLines.join('\n')) as {
      type: string;
      content?: string;
      message?: string;
      tool?: string;
      ok?: boolean;
    };

    // Map server response format to client format
    if (parsed.type === 'chunk' && parsed.content) {
      return { type: 'delta', text: parsed.content };
    } else if (parsed.type === 'tool_call' && parsed.tool) {
      return { type: 'tool_call', tool: parsed.tool };
    } else if (parsed.type === 'tool_result' && parsed.tool) {
      return { type: 'tool_result', tool: parsed.tool, ok: parsed.ok !== false };
    } else if (parsed.type === 'done') {
      return { type: 'done' };
    } else if (parsed.type === 'error') {
      return { type: 'error', message: parsed.message || 'Unknown error' };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Download user progress report PDF
 */
export async function downloadUserReport(
  startDate: Date,
  endDate: Date,
  options?: { includeCharts?: boolean; locale?: string },
): Promise<Blob> {
  const token = authStorage.getAccess();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE}/ai/client/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'PDF generation failed' }));
    throw new Error(error.message || `PDF generation failed: ${response.statusText}`);
  }

  return response.blob();
}
