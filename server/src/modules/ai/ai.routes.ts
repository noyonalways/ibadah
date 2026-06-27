/**
 * AI routes - separate endpoints for client and admin
 */
import { Router } from 'express';
import { AiController } from '@/modules/ai/ai.controller';
import { ChatSessionController } from '@/modules/ai/chat-session.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const controller = new AiController();
const sessionController = new ChatSessionController();

// Client AI routes (for regular users)
export const clientAiRouter = Router();
clientAiRouter.post('/chat', requireAuth, controller.clientChat);
clientAiRouter.post('/chat/tools', requireAuth, controller.clientChatWithTools);
clientAiRouter.post('/pdf', requireAuth, controller.generateUserPdf);

// Admin AI routes (for admin users only)
export const adminAiRouter = Router();
adminAiRouter.post('/chat', requireAuth, requireAdmin, controller.adminChat);
adminAiRouter.post('/chat/tools', requireAuth, requireAdmin, controller.adminChatWithTools);
adminAiRouter.post('/pdf', requireAuth, requireAdmin, controller.generateAdminPdf);

// Chat session routes (shared between client and admin)
export const sessionRouter = Router();
sessionRouter.post('/', requireAuth, sessionController.createSession);
sessionRouter.get('/', requireAuth, sessionController.listSessions);
sessionRouter.get('/:id', requireAuth, sessionController.getSession);
sessionRouter.patch('/:id', requireAuth, sessionController.updateSession);
sessionRouter.delete('/:id', requireAuth, sessionController.deleteSession);
sessionRouter.post('/:id/messages', requireAuth, sessionController.addMessage);
