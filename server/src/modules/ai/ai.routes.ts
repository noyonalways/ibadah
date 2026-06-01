/**
 * AI routes - separate endpoints for client and admin
 */
import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

const controller = new AiController();

// Client AI routes (for regular users)
export const clientAiRouter = Router();
clientAiRouter.post('/chat', requireAuth, controller.clientChat);
clientAiRouter.post('/pdf', requireAuth, controller.generateUserPdf);

// Admin AI routes (for admin users only)
export const adminAiRouter = Router();
adminAiRouter.post('/chat', requireAuth, requireAdmin, controller.adminChat);
adminAiRouter.post('/pdf', requireAuth, requireAdmin, controller.generateAdminPdf);
