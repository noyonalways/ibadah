/**
 * AI Agent Orchestrator
 *
 * Owns the multi-round "agentic" tool loop. Each round it asks the
 * provider for a completion (with the available tools attached). If the
 * model requests tools, we execute them, append the results to the
 * conversation, and loop again. When the model returns plain text — or
 * we hit the round cap — we stop.
 *
 * The provider only ever does a single streamed turn; all of the loop
 * state lives here so every provider behaves identically.
 */
import { toolExecutor } from '@/modules/ai/tools/tool-executor';
import type {
  AiProvider,
  ChatMessage,
  ProviderToolCall,
  ToolSpec,
} from '@/modules/ai/ai.types';
import type { ToolContext } from '@/modules/ai/tools/ai-tools.types';

export type AgentEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_call'; id: string; name: string; arguments: Record<string, unknown> }
  | { type: 'tool_result'; id: string; name: string; ok: boolean; result?: unknown; error?: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface RunAgentOptions {
  provider: AiProvider;
  messages: ChatMessage[];
  tools: ToolSpec[];
  context: ToolContext;
  model: string;
  maxTokens: number;
  temperature: number;
  /** Max tool-executing rounds before we force a final text answer. */
  maxRounds?: number;
  signal?: AbortSignal;
}

const DEFAULT_MAX_ROUNDS = 5;

/**
 * Stringify a tool result for feeding back to the model. We cap the size
 * so a huge payload can't blow the context window — the model gets a
 * truncation marker it can reason about.
 */
function serializeToolResult(ok: boolean, result: unknown, error?: string): string {
  const payload = ok ? { ok: true, data: result } : { ok: false, error: error ?? 'Tool failed' };
  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    json = JSON.stringify({ ok: false, error: 'Result could not be serialized' });
  }
  const LIMIT = 24_000;
  if (json.length > LIMIT) {
    return `${json.slice(0, LIMIT)}…[truncated ${json.length - LIMIT} chars]`;
  }
  return json;
}

export async function* runAgent(options: RunAgentOptions): AsyncIterable<AgentEvent> {
  const {
    provider,
    tools,
    context,
    model,
    maxTokens,
    temperature,
    signal,
    maxRounds = DEFAULT_MAX_ROUNDS,
  } = options;

  const working: ChatMessage[] = [...options.messages];
  const hasTools = tools.length > 0;

  try {
    for (let round = 0; round <= maxRounds; round += 1) {
      if (signal?.aborted) {
        yield { type: 'done' };
        return;
      }

      // On the final permitted round we drop the tools so the model is
      // forced to produce a textual answer instead of looping forever.
      const offerTools = hasTools && round < maxRounds;

      let text = '';
      const toolCalls: ProviderToolCall[] = [];

      for await (const chunk of provider.streamCompletion({
        messages: working,
        model,
        maxTokens,
        temperature,
        tools: offerTools ? tools : undefined,
        signal,
      })) {
        if (chunk.type === 'text') {
          text += chunk.delta;
          yield { type: 'delta', text: chunk.delta };
        } else if (chunk.type === 'tool_call' && offerTools) {
          toolCalls.push(chunk.toolCall);
        }
      }

      // No tool calls → the model has answered. We're done.
      if (toolCalls.length === 0) {
        yield { type: 'done' };
        return;
      }

      // Record the assistant's tool-call turn so the follow-up request
      // has the full causal chain.
      working.push({ role: 'assistant', content: text, toolCalls });

      for (const call of toolCalls) {
        if (signal?.aborted) {
          yield { type: 'done' };
          return;
        }

        yield { type: 'tool_call', id: call.id, name: call.name, arguments: call.arguments };

        const exec = await toolExecutor.execute(call.name, call.arguments, context);

        yield {
          type: 'tool_result',
          id: call.id,
          name: call.name,
          ok: exec.success,
          result: exec.result,
          error: exec.error,
        };

        working.push({
          role: 'tool',
          name: call.name,
          toolCallId: call.id,
          content: serializeToolResult(exec.success, exec.result, exec.error),
        });
      }
    }

    yield { type: 'done' };
  } catch (error) {
    yield { type: 'error', message: (error as Error).message || 'Agent failed' };
  }
}
