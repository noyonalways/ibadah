/**
 * OpenRouter provider implementation (OpenAI-compatible API with native
 * function calling). Adds OpenRouter's attribution headers.
 */
import OpenAI from 'openai';
import { OpenAiCompatibleProvider } from '@/modules/ai/providers/openai-compatible.provider';

export class OpenRouterProvider extends OpenAiCompatibleProvider {
  private readonly _client: OpenAI;
  private readonly siteUrl?: string;
  private readonly siteName?: string;

  constructor(apiKey: string, siteUrl?: string, siteName?: string) {
    super();
    this._client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.siteUrl = siteUrl;
    this.siteName = siteName;
  }

  protected get client(): OpenAI {
    return this._client;
  }

  protected requestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.siteUrl) headers['HTTP-Referer'] = this.siteUrl;
    if (this.siteName) headers['X-Title'] = this.siteName;
    return headers;
  }
}
