/**
 * AI configuration management
 */
import type { ProviderName, AiConfig } from './ai.types.js';

const DEFAULT_MODELS: Record<ProviderName, string> = {
  openrouter: 'openai/gpt-4o-mini',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  gemini: 'gemini-1.5-flash',
};

const PROVIDER_KEY_ENV: Record<ProviderName, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

const ALL_PROVIDERS: readonly ProviderName[] = [
  'openrouter',
  'openai',
  'anthropic',
  'gemini',
];

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

function parseProvider(raw: string | undefined): ProviderName {
  if (!raw) return 'openrouter';
  const lower = raw.toLowerCase();
  if ((ALL_PROVIDERS as readonly string[]).includes(lower)) {
    return lower as ProviderName;
  }
  throw new AiConfigError(
    `Unknown AI_PROVIDER "${raw}". Expected one of: ${ALL_PROVIDERS.join(', ')}.`,
  );
}

function parseNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function getAiConfig(): AiConfig {
  const provider = parseProvider(process.env.AI_PROVIDER);
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];

  const providerKey = process.env[PROVIDER_KEY_ENV[provider]]?.trim();
  const genericKey = process.env.AI_API_KEY?.trim();
  const apiKey = providerKey || genericKey;

  if (!apiKey) {
    throw new AiConfigError(
      `Missing API key for provider "${provider}". Set ${PROVIDER_KEY_ENV[provider]} or AI_API_KEY in your environment.`,
    );
  }

  return {
    provider,
    model,
    apiKey,
    maxTokens: parseNumber(process.env.AI_MAX_TOKENS, 1024),
    temperature: parseNumber(process.env.AI_TEMPERATURE, 0.4),
    siteUrl: process.env.AI_SITE_URL?.trim() || undefined,
    siteName: process.env.AI_SITE_NAME?.trim() || 'Ibadah',
  };
}
