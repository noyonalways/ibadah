/**
 * AI Configuration Routes
 * 
 * Admin-only routes for managing AI provider settings, rate limits,
 * and monitoring AI usage across the application.
 */

import { Router } from 'express';
import { aiConfigController } from '@/modules/ai/ai-config.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const router = Router();

// All routes require authentication and admin privileges
router.use(requireAuth, requireAdmin);

// Provider configuration
router.get('/provider', aiConfigController.getProviderConfig);
router.patch('/provider', aiConfigController.updateProviderConfig);

// Provider testing and discovery
router.post('/test', aiConfigController.testProvider);
router.get('/providers', aiConfigController.getAvailableProviders);

// Rate limiting
router.get('/rate-limit', aiConfigController.getRateLimits);
router.post('/rate-limit', aiConfigController.setRateLimit);

// Usage statistics
router.get('/usage', aiConfigController.getUsageStats);

// General configuration
router.get('/', aiConfigController.getConfig);

export { router as aiConfigRouter };
