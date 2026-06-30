/**
 * Shared types for AI module
 */

export type ProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini';

export type SystemSurface = 'landing' | 'dashboard' | 'admin';

/**
 * A function/tool call requested by the model. `arguments` is the parsed
 * JSON object the model wants the tool invoked with.
 */
export interface ProviderToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Present on assistant turns that requested one or more tools. */
  toolCalls?: ProviderToolCall[];
  /** Present on `tool` turns — which assistant tool call this answers. */
  toolCallId?: string;
  /** Present on `tool` turns — the tool name (helps some providers). */
  name?: string;
}

/**
 * Provider-agnostic tool definition (JSON-Schema parameters). Each
 * provider adapter translates this into its own wire format.
 */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * A single streamed piece of a completion. Either a text delta or a
 * fully-assembled tool call (providers buffer partial tool-call JSON and
 * only emit it once complete).
 */
export type CompletionChunk =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; toolCall: ProviderToolCall };

export interface AiConfig {
  provider: ProviderName;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  siteUrl?: string;
  siteName?: string;
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  model: string;
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

export interface StreamCompletionOptions extends StreamChatOptions {
  /** Tools the model may call this turn. Omit/empty to disable tools. */
  tools?: ToolSpec[];
}

export interface AiProvider {
  /** Plain text streaming (no tools). Kept for simple/legacy callers. */
  streamChat(options: StreamChatOptions): AsyncIterable<string>;
  /**
   * Single-turn completion that streams text deltas and surfaces any
   * tool calls the model requests. The multi-round tool loop lives in
   * the agent orchestrator, not the provider.
   */
  streamCompletion(options: StreamCompletionOptions): AsyncIterable<CompletionChunk>;
}
