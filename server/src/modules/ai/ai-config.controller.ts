/**
 * AI Configuration Controller
 * 
 * Manages AI provider settings and application-level configuration.
 * All endpoints require admin privileges.
 */

import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { aiConfigService } from '@/modules/ai/ai-config.service';
import { 
  updateProviderConfigSchema, 
  testProviderSchema,
  setRateLimitSchema,
} from '@/modules/ai/ai-config.validation';

export class AiConfigController {
  /**
   * Get current AI configuration
   * GET /api/v1/ai/config
   */
  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get current config (non-sensitive)
      const config = await aiConfigService.getConfig();
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          provider: config.activeProvider,
          model: config.defaultModel,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          siteName: config.siteName,
          siteUrl: config.siteUrl,
          features: config.features,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get detailed provider configuration (admin only)
   * GET /api/v1/ai/config/provider
   */
  getProviderConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await aiConfigService.getProviderConfig();
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update provider configuration
   * PATCH /api/v1/ai/config/provider
   */
  updateProviderConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, ...updates } = updateProviderConfigSchema.parse(req.body);

      if (!name) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Provider name is required',
        });
        return;
      }

      const updated = await aiConfigService.updateProviderConfig(name, updates);
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Provider configuration updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test a provider connection
   * POST /api/v1/ai/config/test
   */
  testProvider = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const parsed = testProviderSchema.parse(req.body);
      
      const testResult = await aiConfigService.testProvider(parsed.provider, parsed.apiKey, parsed.model);
      
      res.status(StatusCodes.OK).json({
        success: testResult.success,
        message: testResult.message,
        data: {
          latency: testResult.latency,
          modelAvailable: testResult.modelAvailable,
          provider: parsed.provider,
        },
      });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: (error as Error).message,
      });
    }
  };

  /**
   * Get available AI providers and models
   * GET /api/v1/ai/config/providers
   */
  getAvailableProviders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const providers = await aiConfigService.getAvailableProviders();
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set rate limiting for AI API usage
   * POST /api/v1/ai/config/rate-limit
   */
  setRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = setRateLimitSchema.parse(req.body);
      
      const updated = await aiConfigService.setRateLimit(parsed);
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Rate limits updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current rate limits
   * GET /api/v1/ai/config/rate-limit
   */
  getRateLimits = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limits = await aiConfigService.getRateLimits();
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: limits,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get AI usage statistics
   * GET /api/v1/ai/config/usage
   */
  getUsageStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = Math.min(parseInt(req.query.days as string) || 30, 90);
      
      const stats = await aiConfigService.getUsageStats(days);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const aiConfigController = new AiConfigController();
