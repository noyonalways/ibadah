/**
 * Shared types for the Ibadah admin-panel AI chat layer. Mirrors the
 * client's `lib/ai/types.ts` so both apps speak the same wire format
 * — copied verbatim per the repo's existing pattern (see
 * `admin/src/lib/api.ts`, which mirrors the client API helper).
 */

export type ChatRole = 'system' | 'user' | 'assistant';

/**
 * A tool the assistant invoked while answering. Surfaced in the UI so
 * operators can see which live data the copilot pulled.
 */
export interface ToolActivity {
  name: string;
  status: 'running' | 'done' | 'error';
}

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  charts?: ChartSpec[];
  tools?: ToolActivity[];
  createdAt?: string;
}

export interface ChartSpec {
  type: 'bar' | 'line' | 'area' | 'pie';
  title?: string;
  description?: string;
  xKey?: string;
  yKeys?: string[];
  yLabels?: string[];
  colors?: string[];
  data: Array<Record<string, string | number | null>>;
  unit?: string;
  stacked?: boolean;
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text?: string }
  | { type: 'error'; message: string }
  | { type: 'tool_call'; tool: string }
  | { type: 'tool_result'; tool: string; ok: boolean }
  /** Emitted once at the start with the persisted session id. */
  | { type: 'session'; sessionId: string };

export interface ChatRequestBody {
  messages: ChatMessage[];
  context?: string;
  surface?: 'landing' | 'dashboard' | 'admin';
  /** Existing session to append to; omit/null to start a new one. */
  sessionId?: string | null;
}

export interface ChatProvider {
  readonly name: ProviderName;
  streamChat(input: ProviderChatInput): AsyncIterable<string>;
}

export type ProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini';

export interface ProviderChatInput {
  messages: ChatMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}
