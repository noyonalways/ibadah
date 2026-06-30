/**
 * AI routes
 *
 * Cleanly split by audience:
 *   - guestAiRouter   →  /ai/guest/*    (public, landing-page visitors)
 *   - clientAiRouter  →  /ai/client/*   (any authenticated user)
 *   - adminAiRouter   →  /ai/admin/*    (admins only)
 *
 * Each surface exposes both `/chat` and a `/sessions/*` chat-history CRUD
 * sub-router (the session routes are identical and always scoped to the
 * authenticated caller; the only difference is the audience prefix and the
 * auth applied by the parent router).
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
import rateLimit from 'express-rate-limit';
import { AiController } from '@/modules/ai/ai.controller';
import { ChatSessionController } from '@/modules/ai/chat/chat-session.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const controller = new AiController();
const sessionController = new ChatSessionController();

/**
 * Build the chat-session CRUD sub-router. Auth is enforced by the parent
 * (client/admin) router, so these routes stay audience-agnostic.
 */
function createSessionRouter(): Router {
  const router = Router();
  router.post('/', sessionController.createSession);
  router.get('/', sessionController.listSessions);
  router.get('/:id', sessionController.getSession);
  router.patch('/:id', sessionController.updateSession);
  router.delete('/:id', sessionController.deleteSession);
  router.post('/:id/messages', sessionController.addMessage);
  return router;
}

// Guest AI routes — public landing-page chat.  /ai/guest/*
const guestAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest chat requests. Please try again later or create a free account.',
  },
});

export const guestAiRouter = Router();
guestAiRouter.post('/chat', guestAiLimiter, controller.guestChat);

// Client AI routes — available to any authenticated user.  /ai/client/*
export const clientAiRouter = Router();
clientAiRouter.use(requireAuth);
clientAiRouter.post('/chat', controller.clientChat);
clientAiRouter.use('/sessions', createSessionRouter());

// Admin AI routes — admins only.  /ai/admin/*
export const adminAiRouter = Router();
adminAiRouter.use(requireAuth, requireAdmin);
adminAiRouter.post('/chat', controller.adminChat);
adminAiRouter.use('/sessions', createSessionRouter());
