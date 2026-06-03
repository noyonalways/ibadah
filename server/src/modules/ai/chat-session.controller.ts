/**
 * Chat session controller - handles HTTP endpoints for chat session management
 */
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ChatSessionService } from './chat-session.service.js';
import type { Types } from 'mongoose';

const createSessionSchema = z.object({
  surface: z.enum(['landing', 'dashboard', 'admin']).default('dashboard'),
  title: z.string().max(200).optional().default('New Chat'),
});

const updateTitleSchema = z.object({
  title: z.string().min(1).max(200),
});

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

const listSessionsSchema = z.object({
  surface: z.enum(['landing', 'dashboard', 'admin']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  skip: z.coerce.number().int().min(0).optional().default(0),
});

export class ChatSessionController {
  private service: ChatSessionService;

  constructor() {
    this.service = new ChatSessionService();
  }

  /**
   * Create a new chat session
   * POST /api/v1/ai/sessions
   */
  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const parsed = createSessionSchema.parse(req.body);
      const session = await this.service.createSession(userId, parsed.surface, parsed.title);

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          id: session._id,
          title: session.title,
          surface: session.surface,
          lastMessageAt: session.lastMessageAt,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all sessions for the authenticated user
   * GET /api/v1/ai/sessions
   */
  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const parsed = listSessionsSchema.parse(req.query);
      const sessions = await this.service.getUserSessions(userId, {
        surface: parsed.surface,
        limit: parsed.limit,
        skip: parsed.skip,
      });

      const total = await this.service.getUserSessionCount(userId, parsed.surface);

      res.json({
        success: true,
        data: {
          sessions: sessions.map((s) => ({
            id: s._id,
            title: s.title,
            surface: s.surface,
            messageCount: s.messageCount,
            lastMessageAt: s.lastMessageAt,
            createdAt: s.createdAt,
          })),
          pagination: {
            total,
            limit: parsed.limit,
            skip: parsed.skip,
            hasMore: parsed.skip + sessions.length < total,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single session with all messages
   * GET /api/v1/ai/sessions/:id
   */
  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const sessionId = req.params.id;
      const result = await this.service.getSessionWithMessages(sessionId, userId);

      if (!result) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: result.session._id,
          title: result.session.title,
          surface: result.session.surface,
          messageCount: result.session.messageCount,
          messages: result.messages.map((m) => ({
            id: m._id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
          lastMessageAt: result.session.lastMessageAt,
          createdAt: result.session.createdAt,
          updatedAt: result.session.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update session title
   * PATCH /api/v1/ai/sessions/:id
   */
  updateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const sessionId = req.params.id;
      const parsed = updateTitleSchema.parse(req.body);

      const session = await this.service.updateSessionTitle(sessionId, parsed.title, userId);

      if (!session) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: session._id,
          title: session.title,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a session
   * DELETE /api/v1/ai/sessions/:id
   */
  deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const sessionId = req.params.id;
      const deleted = await this.service.deleteSession(sessionId, userId);

      if (!deleted) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add a message to a session
   * POST /api/v1/ai/sessions/:id/messages
   */
  addMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const sessionId = req.params.id;
      const parsed = addMessageSchema.parse(req.body);

      // Verify session ownership
      const existingSession = await this.service.getSession(sessionId, userId);
      if (!existingSession) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      const message = await this.service.addMessage(sessionId, parsed.role, parsed.content);

      if (!message) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: message._id,
          sessionId: message.sessionId,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
