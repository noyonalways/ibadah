/**
 * Provider factory. Reads the active config and returns the matching
 * adapter. Adding a new provider is a 4-step change:
 *
 *   1. Add it to `ProviderName` in `../types.ts`.
 *   2. Add a default model to `DEFAULT_MODELS` in `../config.ts`.
 *   3. Add the env var name to `PROVIDER_KEY_ENV` in `../config.ts`.
 *   4. Add a `case` here that instantiates the adapter.
 */
import type { AiConfig } from '../config';
import type { ChatProvider } from '../types';
import { createOpenRouterProvider } from './openrouter';
import { createOpenAiProvider } from './openai';
import { createAnthropicProvider } from './anthropic';
import { createGeminiProvider } from './gemini';

export function createProvider(config: AiConfig): ChatProvider {
  switch (config.provider) {
    case 'openrouter':
      return createOpenRouterProvider(config);
    case 'openai':
      return createOpenAiProvider(config);
    case 'anthropic':
      return createAnthropicProvider(config);
    case 'gemini':
      return createGeminiProvider(config);
    default: {
      // Exhaustiveness check — if we add a new provider name and forget
      // to handle it here, TypeScript will fail this assignment.
      const _never: never = config.provider;
      throw new Error(`Unhandled AI provider: ${String(_never)}`);
    }
  }
}
