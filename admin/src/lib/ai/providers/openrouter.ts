/**
 * OpenRouter provider — speaks the OpenAI Chat Completions API at
 * `https://openrouter.ai/api/v1/chat/completions`. Models are
 * referenced by `vendor/model` slugs, e.g. `anthropic/claude-3-5-sonnet`
 * or `openai/gpt-4o-mini`.
 *
 * Reference: https://openrouter.ai/docs/api-reference/streaming
 *
 * We use this as the default provider because it lets the operator
 * swap models without changing code or rotating keys.
 */
import type { AiConfig } from '../config';
import type { ChatProvider, ProviderChatInput } from '../types';
import { streamOpenAiCompatible, toOpenAiMessages } from './openai-compatible';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export function createOpenRouterProvider(config: AiConfig): ChatProvider {
  return {
    name: 'openrouter',
    async *streamChat(input: ProviderChatInput): AsyncIterable<string> {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      };
      // Optional but recommended by OpenRouter for ranked routing.
      if (config.siteUrl) headers['HTTP-Referer'] = config.siteUrl;
      if (config.siteName) headers['X-Title'] = config.siteName;

      yield* streamOpenAiCompatible({
        url: `${OPENROUTER_BASE}/chat/completions`,
        headers,
        body: {
          model: input.model,
          messages: toOpenAiMessages(input.messages),
          stream: true,
          max_tokens: input.maxTokens,
          temperature: input.temperature,
        },
        signal: input.signal,
      });
    },
  };
}
