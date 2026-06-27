/**
 * Shared types for the Ibadah AI chat layer.
 *
 * The same shapes are used both server-side (in the chat API route +
 * provider adapters) and client-side (in the chat hook + widget UI), so
 * the wire format stays in lockstep without a build-time generator.
 */

export type ChatRole = 'system' | 'user' | 'assistant';

/**
 * A tool the assistant invoked while answering. Surfaced in the UI so
 * users can see which of their data the assistant looked at.
 */
export interface ToolActivity {
  name: string;
  status: 'running' | 'done' | 'error';
}

export interface ChatMessage {
  /** Stable id, generated client-side for React keys + dedupe. */
  id?: string;
  role: ChatRole;
  content: string;
  /**
   * Charts attached to an assistant message. Populated by the client
   * after parsing fenced ```chart``` blocks out of the streamed text.
   */
  charts?: ChartSpec[];
  /** Tools invoked while producing this assistant message. */
  tools?: ToolActivity[];
  /** ISO timestamp set when the message is finalized. */
  createdAt?: string;
}

/**
 * Visualization payload the model is instructed to emit inside a
 * fenced ```chart\n{json}\n``` block. Renderers ignore unknown fields
 * so we can extend the shape without breaking older messages.
 */
export interface ChartSpec {
  /** Chart kind. The renderer falls back to `bar` for unknowns. */
  type: 'bar' | 'line' | 'area' | 'pie';
  title?: string;
  description?: string;
  /** X-axis / category key. Defaults to `label`. */
  xKey?: string;
  /** One or more numeric series keys. Defaults to `[value]`. */
  yKeys?: string[];
  /** Friendly labels for each series, matched by index against yKeys. */
  yLabels?: string[];
  /**
   * Color tokens (var-name without the `--`, e.g. `primary`, `accent`,
   * `chart-1`) or any CSS color string. Cycles through the array per
   * series.
   */
  colors?: string[];
  /** Tabular data — must be JSON-serializable primitives. */
  data: Array<Record<string, string | number | null>>;
  /** Optional unit label appended to the y axis tooltip. */
  unit?: string;
  /** Whether to stack multiple series (bar/area only). */
  stacked?: boolean;
}

/**
 * Stream event shape emitted by the server `/api/ai/chat` route over
 * `text/event-stream`. The client decodes one JSON object per `data:`
 * line.
 *
 * - `delta`: append `text` to the current assistant message.
 * - `done`:  the response is complete. The full `text` is included as
 *            a convenience for callers that didn't accumulate deltas.
 * - `error`: a fatal error happened mid-stream. The connection will
 *            close after this event.
 */
export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text?: string }
  | { type: 'error'; message: string }
  | { type: 'tool_call'; tool: string }
  | { type: 'tool_result'; tool: string; ok: boolean };

export interface ChatRequestBody {
  /**
   * Conversation history. The system prompt is prepended server-side
   * so callers don't have to know which provider expects what.
   */
  messages: ChatMessage[];
  /**
   * Optional context block injected just below the system prompt.
   * Useful for passing the user's recent stats so the model can
   * reason about them.
   */
  context?: string;
  /**
   * Override the surface for the system prompt. Defaults to
   * `landing` for unauthenticated requests and `dashboard` for
   * authenticated ones.
   */
  surface?: 'landing' | 'dashboard' | 'admin';
}

/**
 * Provider-agnostic streaming contract. Each adapter (OpenRouter,
 * OpenAI, Anthropic, Gemini) yields plain text deltas — the route
 * wraps them in `StreamEvent`s before sending to the browser.
 */
export interface ChatProvider {
  readonly name: ProviderName;
  /**
   * Open a streaming chat completion. Implementations MUST yield
   * partial text fragments as soon as they arrive, and MUST close
   * the iterator when the upstream is done. They SHOULD throw on
   * non-2xx upstream responses (the route translates the throw into
   * a `{type:"error"}` event).
   */
  streamChat(input: ProviderChatInput): AsyncIterable<string>;
}

export type ProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini';

export interface ProviderChatInput {
  /** Already-merged conversation including the system prompt. */
  messages: ChatMessage[];
  model: string;
  /** Hard cap on output tokens. */
  maxTokens?: number;
  /** Sampling temperature; providers clamp to their own valid range. */
  temperature?: number;
  /** Aborts the upstream request when the client disconnects. */
  signal?: AbortSignal;
}
