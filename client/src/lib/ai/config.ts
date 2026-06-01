/**
 * Server-side AI configuration. Reads provider, model, and API key
 * from the environment so the deployment can switch providers without
 * any code change.
 *
 * Environment variables (server-side only — never `NEXT_PUBLIC_*`,
 * because we never want the API key in the browser bundle):
 *
 *   AI_PROVIDER             openrouter | openai | anthropic | gemini   (default: openrouter)
 *   AI_MODEL                model id for the active provider           (default: provider-specific)
 *   AI_API_KEY              the active provider's API key              (preferred)
 *
 *   OPENROUTER_API_KEY      provider-specific overrides — used as a
 *   OPENAI_API_KEY          fallback when AI_API_KEY isn't set, so
 *   ANTHROPIC_API_KEY       multiple providers can coexist while
 *   GEMINI_API_KEY          experimenting.
 *
 *   AI_MAX_TOKENS           default output cap (default: 1024)
 *   AI_TEMPERATURE          default sampling temperature (default: 0.4)
 *   AI_SITE_URL             OpenRouter `HTTP-Referer` (default: NEXT_PUBLIC_SITE_URL)
 *   AI_SITE_NAME            OpenRouter `X-Title` header (default: 'Ibadah')
 *
 * The function throws when the active provider's key is missing — the
 * route catches that and returns a 503 with a clear message instead
 * of crashing the build.
 */
import type { ProviderName } from './types';

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

export interface AiConfig {
  provider: ProviderName;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  /** OpenRouter-only: forwarded as the `HTTP-Referer` header. */
  siteUrl?: string;
  /** OpenRouter-only: forwarded as the `X-Title` header. */
  siteName?: string;
}

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

/**
 * Resolves the active configuration. Should only be called from server
 * code (route handlers, server components). Calling from the browser
 * is a programmer error and will return whatever happens to be on
 * `process.env` (i.e., basically nothing).
 */
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
    siteUrl:
      process.env.AI_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      undefined,
    siteName: process.env.AI_SITE_NAME?.trim() || 'Ibadah',
  };
}

/**
 * Lightweight readiness check that doesn't throw. Useful for the
 * widget UI to decide whether to render at all.
 */
export function isAiConfigured(): boolean {
  try {
    getAiConfig();
    return true;
  } catch {
    return false;
  }
}
