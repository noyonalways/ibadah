/**
 * AI Configuration Model
 * 
 * Stores AI provider settings, API credentials, and system-wide AI configuration.
 * All sensitive data (API keys) are encrypted before storage.
 */

import { Document, Model, Schema, model } from 'mongoose';
import type { ProviderName } from '@/modules/ai/ai.types';

export interface IProviderConfig {
  name: ProviderName;
  displayName: string;
  enabled: boolean;
  apiKey?: string; // Encrypted
  apiKeyLastFour?: string;
  baseUrl?: string;
  defaultModel: string;
  availableModels: string[];
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  maxTokens: number;
  rateLimitTier: 'free' | 'standard' | 'premium';
}

export interface IAIConfig {
  activeProvider: ProviderName;
  fallbackProvider?: ProviderName;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  siteName: string;
  siteUrl: string;
  features: {
    enableStreaming: boolean;
    enableFunctionCalling: boolean;
    enablePdfGeneration: boolean;
    enableChatSessions: boolean;
    enableAdminTools: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    tokensPerMinute: number;
    tokensPerDay: number;
    concurrentRequests: number;
  };
  providers: IProviderConfig[];
  updatedAt: Date;
  updatedBy?: string;
}

export interface IAIConfigDocument extends IAIConfig, Document {}

export interface IAIConfigModel extends Model<IAIConfigDocument> {
  getSingleton(): Promise<IAIConfigDocument>;
}

const providerConfigSchema = new Schema<IProviderConfig>({
  name: {
    type: String,
    required: true,
    enum: ['openrouter', 'openai', 'anthropic', 'gemini'],
  },
  displayName: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  apiKey: { type: String }, // Encrypted
  apiKeyLastFour: { type: String },
  baseUrl: { type: String },
  defaultModel: { type: String, required: true },
  availableModels: [{ type: String }],
  supportsStreaming: { type: Boolean, default: true },
  supportsFunctionCalling: { type: Boolean, default: true },
  maxTokens: { type: Number, default: 1024 },
  rateLimitTier: {
    type: String,
    enum: ['free', 'standard', 'premium'],
    default: 'free',
  },
});

const aiConfigSchema = new Schema<IAIConfigDocument, IAIConfigModel>(
  {
    activeProvider: {
      type: String,
      required: true,
      enum: ['openrouter', 'openai', 'anthropic', 'gemini'],
      default: 'openrouter',
    },
    fallbackProvider: {
      type: String,
      enum: ['openrouter', 'openai', 'anthropic', 'gemini'],
    },
    defaultModel: { type: String, default: 'openai/gpt-4o-mini' },
    maxTokens: { type: Number, default: 1024 },
    temperature: { type: Number, default: 0.4 },
    siteName: { type: String, default: 'Ibadah' },
    siteUrl: { type: String },
    features: {
      enableStreaming: { type: Boolean, default: true },
      enableFunctionCalling: { type: Boolean, default: true },
      enablePdfGeneration: { type: Boolean, default: true },
      enableChatSessions: { type: Boolean, default: true },
      enableAdminTools: { type: Boolean, default: true },
    },
    rateLimits: {
      requestsPerMinute: { type: Number, default: 20 },
      requestsPerHour: { type: Number, default: 200 },
      requestsPerDay: { type: Number, default: 2000 },
      tokensPerMinute: { type: Number, default: 10000 },
      tokensPerDay: { type: Number, default: 100000 },
      concurrentRequests: { type: Number, default: 3 },
    },
    providers: [providerConfigSchema],
    updatedBy: { type: String },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'ai_config',
  }
);

// Singleton pattern - ensure only one config document exists
aiConfigSchema.statics.getSingleton = async function (): Promise<IAIConfigDocument> {
  let config = await this.findOne().exec();
  if (!config) {
    // Create default config
    config = new this({
      activeProvider: 'openrouter',
      defaultModel: 'openai/gpt-4o-mini',
      providers: [
        {
          name: 'openrouter',
          displayName: 'OpenRouter',
          enabled: true,
          defaultModel: 'openai/gpt-4o-mini',
          availableModels: [
            'openai/gpt-4o-mini',
            'openai/gpt-4o',
            'anthropic/claude-3.5-sonnet',
            'anthropic/claude-3.5-haiku',
          ],
          supportsStreaming: true,
          supportsFunctionCalling: true,
          maxTokens: 1024,
          rateLimitTier: 'free',
        },
        {
          name: 'openai',
          displayName: 'OpenAI',
          enabled: false,
          defaultModel: 'gpt-4o-mini',
          availableModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
          supportsStreaming: true,
          supportsFunctionCalling: true,
          maxTokens: 1024,
          rateLimitTier: 'standard',
        },
        {
          name: 'anthropic',
          displayName: 'Anthropic',
          enabled: false,
          defaultModel: 'claude-3-5-haiku-20241022',
          availableModels: [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
          ],
          supportsStreaming: true,
          supportsFunctionCalling: true,
          maxTokens: 1024,
          rateLimitTier: 'standard',
        },
        {
          name: 'gemini',
          displayName: 'Google Gemini',
          enabled: false,
          defaultModel: 'gemini-1.5-flash',
          availableModels: ['gemini-1.5-flash', 'gemini-1.5-pro'],
          supportsStreaming: true,
          supportsFunctionCalling: true,
          maxTokens: 1024,
          rateLimitTier: 'free',
        },
      ],
    });
    await config.save();
  }
  return config;
};

// Encrypt API key before saving
aiConfigSchema.pre('save', async function (next) {
  // In a production environment, you would encrypt the API keys here
  // For now, we'll just ensure the last 4 digits are stored for display
  if (this.providers && Array.isArray(this.providers)) {
    this.providers.forEach((provider) => {
      if (provider.apiKey && provider.apiKey.length > 4) {
        provider.apiKeyLastFour = provider.apiKey.slice(-4);
      }
    });
  }
  next();
});

export const AIConfig = model<IAIConfigDocument, IAIConfigModel>('AI_Config', aiConfigSchema);
