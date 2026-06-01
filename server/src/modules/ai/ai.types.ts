/**
 * Shared types for AI module
 */

export type ProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini';

export type SystemSurface = 'landing' | 'dashboard' | 'admin';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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

export interface AiProvider {
  streamChat(options: StreamChatOptions): AsyncIterable<string>;
}

export interface PdfGenerationOptions {
  userId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts?: boolean;
  locale?: string;
}

export interface AdminPdfOptions {
  reportType: 'analytics' | 'users' | 'moderation' | 'audit';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
}
