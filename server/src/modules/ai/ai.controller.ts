/**
 * AI controller — handles chat (with agentic tool calling) and PDF
 * generation endpoints.
 */
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getAiConfig, AiConfigError } from '@/modules/ai/ai.config';
import { createProvider } from '@/modules/ai/providers/index';
import { getSystemPrompt } from '@/modules/ai/system-prompts';
import { runAgent } from '@/modules/ai/agent.service';
import { toolRegistry } from '@/modules/ai/tools/tool-registry';
import { PdfService } from '@/modules/ai/pdf.service';
import { ChatSessionService } from '@/modules/ai/chat-session.service';
import type { ChatMessage, SystemSurface } from '@/modules/ai/ai.types';
import type { ToolContext } from '@/modules/ai/tools/ai-tools.types';
import {
  clientChatSchema,
  adminChatSchema,
  userPdfSchema,
  adminPdfSchema,
} from '@/modules/ai/ai.validation';

type ChatRole = 'user' | 'admin';

export class AiController {
  private pdfService: PdfService;
  private sessionService: ChatSessionService;

  constructor() {
    this.pdfService = new PdfService();
    this.sessionService = new ChatSessionService();
  }

  /**
   * Shared chat handler. Runs the agentic tool loop and streams the
   * result (text deltas + tool activity) back over SSE. Used by both the
   * client and admin surfaces — the only differences are the persona,
   * the validation schema, and which tools are exposed.
   */
  private async handleChat(
    req: Request,
    res: Response,
    next: NextFunction,
    role: ChatRole,
  ): Promise<void> {
    try {
      const parsed = role === 'admin' ? adminChatSchema.parse(req.body) : clientChatSchema.parse(req.body);

      let config;
      try {
        config = await getAiConfig();
      } catch (err) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          success: false,
          message:
            err instanceof AiConfigError ? err.message : 'AI is not configured on this server.',
        });
        return;
      }

      const surface: SystemSurface =
        role === 'admin' ? 'admin' : ((parsed as { surface?: SystemSurface }).surface ?? 'dashboard');

      const systemMessages: ChatMessage[] = [{ role: 'system', content: getSystemPrompt(surface) }];

      if (parsed.context && parsed.context.trim().length > 0) {
        const label = role === 'admin' ? 'Operator context (read-only)' : 'User context (read-only)';
        systemMessages.push({ role: 'system', content: `${label}:\n${parsed.context.trim()}` });
      }

      const userMessages = parsed.messages.filter((m) => m.role !== 'system');
      const merged: ChatMessage[] = [...systemMessages, ...userMessages];

      const provider = createProvider(config);
      const tools = toolRegistry.getToolSpecs(role);

      // Resolve (or lazily create) the chat session so the conversation is
      // persisted for history. Persistence is best-effort — a failure here
      // must never block the actual chat response.
      const userId = req.user!.id;
      let sessionId: string | null = null;
      try {
        const requestedSessionId = (parsed as { sessionId?: string }).sessionId;
        let session = requestedSessionId
          ? await this.sessionService.getSession(requestedSessionId, userId)
          : null;
        if (!session) {
          session = await this.sessionService.createSession(userId, surface);
        }
        sessionId = session._id.toString();

        // Persist the newest user turn before streaming the reply.
        const lastUserMessage = [...userMessages].reverse().find((m) => m.role === 'user');
        if (lastUserMessage) {
          await this.sessionService.addMessage(sessionId, 'user', lastUserMessage.content);
        }
      } catch {
        sessionId = null;
      }

      const context: ToolContext = {
        userId,
        userRole: req.user!.role as ChatRole,
        sessionId: sessionId ?? (req.body as { sessionId?: string }).sessionId,
        requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
      };

      // SSE setup
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const abortController = new AbortController();
      req.on('close', () => {
        abortController.abort();
        res.end();
      });

      const write = (payload: Record<string, unknown>) => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      // Tell the client which session this conversation belongs to so it
      // can update its URL/history sidebar (especially for new sessions).
      if (sessionId) write({ type: 'session', sessionId });

      let assistantText = '';

      try {
        for await (const event of runAgent({
          provider,
          messages: merged,
          tools,
          context,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          signal: abortController.signal,
        })) {
          if (res.writableEnded) break;

          switch (event.type) {
            case 'delta':
              assistantText += event.text;
              write({ type: 'chunk', content: event.text });
              break;
            case 'tool_call':
              write({ type: 'tool_call', tool: event.name, arguments: event.arguments });
              break;
            case 'tool_result':
              // Keep the wire payload light — the model already has the
              // full result; the client only needs to show activity.
              write({ type: 'tool_result', tool: event.name, ok: event.ok, error: event.error });
              break;
            case 'error':
              write({ type: 'error', message: event.message });
              break;
            case 'done':
              write({ type: 'done' });
              break;
          }
        }
      } catch {
        write({ type: 'error', message: 'Stream error occurred' });
      } finally {
        // Persist the assistant's reply (whatever was produced, including
        // partial output on disconnect/error). Best-effort only.
        if (sessionId && assistantText.trim().length > 0) {
          try {
            await this.sessionService.addMessage(sessionId, 'assistant', assistantText);
          } catch {
            /* best-effort persistence */
          }
        }
        if (!res.writableEnded) res.end();
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Client chat endpoint — POST /api/v1/ai/client/chat
   */
  clientChat = (req: Request, res: Response, next: NextFunction): Promise<void> =>
    this.handleChat(req, res, next, 'user');

  /**
   * Admin chat endpoint — POST /api/v1/ai/admin/chat
   */
  adminChat = (req: Request, res: Response, next: NextFunction): Promise<void> =>
    this.handleChat(req, res, next, 'admin');

  /**
   * Backwards-compatible aliases. The `/chat` endpoints are now fully
   * tool-enabled, so these route to the same handler.
   */
  clientChatWithTools = (req: Request, res: Response, next: NextFunction): Promise<void> =>
    this.handleChat(req, res, next, 'user');

  adminChatWithTools = (req: Request, res: Response, next: NextFunction): Promise<void> =>
    this.handleChat(req, res, next, 'admin');

  /**
   * Generate user progress report PDF
   * POST /api/v1/ai/client/pdf
   */
  generateUserPdf = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = userPdfSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const pdfBuffer = await this.pdfService.generateUserReport({
        userId,
        dateRange: {
          start: new Date(parsed.startDate),
          end: new Date(parsed.endDate),
        },
        includeCharts: parsed.includeCharts,
        locale: parsed.locale,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ibadah-report-${userId}-${Date.now()}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate admin analytics report PDF
   * POST /api/v1/ai/admin/pdf
   */
  generateAdminPdf = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = adminPdfSchema.parse(req.body);

      const pdfBuffer = await this.pdfService.generateAdminReport({
        reportType: parsed.reportType,
        dateRange: {
          start: new Date(parsed.startDate),
          end: new Date(parsed.endDate),
        },
        filters: parsed.filters,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="admin-${parsed.reportType}-${Date.now()}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
