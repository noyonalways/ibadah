/**
 * AI routes
 *
 * Cleanly split by audience:
 *   - clientAiRouter  →  /ai/client/*   (any authenticated user)
 *   - adminAiRouter   →  /ai/admin/*    (admins only)
 *   - sessionRouter   →  /ai/sessions/* (shared chat-history CRUD)
 *
 * Provider/credential management lives in `ai-config.routes.ts` (admin only).
 * PDF report generation is not an AI concern — it lives in the `report`
 * module (`/reports/*`).
 *
 * The `/chat` endpoints are fully agentic: the model is given the tools for
 * the caller's role and the agent loop executes them server-side, so there's
 * no separate "tools" endpoint to call from the UI.
 */
import { Router } from 'express';
import { AiController } from '@/modules/ai/ai.controller';
import { ChatSessionController } from '@/modules/ai/chat/chat-session.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const controller = new AiController();
const sessionController = new ChatSessionController();

// Client AI routes — available to any authenticated user.
export const clientAiRouter = Router();
clientAiRouter.use(requireAuth);
clientAiRouter.post('/chat', controller.clientChat);

// Admin AI routes — admins only.
export const adminAiRouter = Router();
adminAiRouter.use(requireAuth, requireAdmin);
adminAiRouter.post('/chat', controller.adminChat);

// Chat session history — shared by both surfaces, scoped to the caller.
export const sessionRouter = Router();
sessionRouter.use(requireAuth);
sessionRouter.post('/', sessionController.createSession);
sessionRouter.get('/', sessionController.listSessions);
sessionRouter.get('/:id', sessionController.getSession);
sessionRouter.patch('/:id', sessionController.updateSession);
sessionRouter.delete('/:id', sessionController.deleteSession);
sessionRouter.post('/:id/messages', sessionController.addMessage);
