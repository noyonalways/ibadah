/**
 * AI controller - handles chat and PDF generation endpoints
 */
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getAiConfig, AiConfigError } from './ai.config.js';
import { createProvider } from './providers/index.js';
import { getSystemPrompt } from './system-prompts.js';
import { PdfService } from './pdf.service.js';
import type { ChatMessage, SystemSurface } from './ai.types.js';
import {
  clientChatSchema,
  adminChatSchema,
  userPdfSchema,
  adminPdfSchema,
} from './ai.validation.js';

export class AiController {
  private pdfService: PdfService;

  constructor() {
    this.pdfService = new PdfService();
  }

  /**
   * Client chat endpoint - for regular users
   * POST /api/v1/ai/client/chat
   */
  clientChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = clientChatSchema.parse(req.body);

      let config;
      try {
        config = getAiConfig();
      } catch (err) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          success: false,
          message:
            err instanceof AiConfigError
              ? err.message
              : 'AI is not configured on this server.',
        });
        return;
      }

      const surface: SystemSurface = parsed.surface ?? 'dashboard';
      const systemMessages: ChatMessage[] = [
        { role: 'system', content: getSystemPrompt(surface) },
      ];

      if (parsed.context && parsed.context.trim().length > 0) {
        systemMessages.push({
          role: 'system',
          content: `User context (read-only):\n${parsed.context.trim()}`,
        });
      }

      const userMessages = parsed.messages.filter((m) => m.role !== 'system');
      const merged: ChatMessage[] = [...systemMessages, ...userMessages];

      const provider = createProvider(config);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Handle client disconnect
      req.on('close', () => {
        res.end();
      });

      try {
        const stream = provider.streamChat({
          messages: merged,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        });

        for await (const chunk of stream) {
          if (res.writableEnded) break;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }

        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        }
      } catch (streamError) {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' })}\n\n`,
          );
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin chat endpoint - for admin users
   * POST /api/v1/ai/admin/chat
   */
  adminChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = adminChatSchema.parse(req.body);

      let config;
      try {
        config = getAiConfig();
      } catch (err) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          success: false,
          message:
            err instanceof AiConfigError
              ? err.message
              : 'AI is not configured on this server.',
        });
        return;
      }

      // Always use admin persona
      const systemMessages: ChatMessage[] = [
        { role: 'system', content: getSystemPrompt('admin') },
      ];

      if (parsed.context && parsed.context.trim().length > 0) {
        systemMessages.push({
          role: 'system',
          content: `Operator context (read-only):\n${parsed.context.trim()}`,
        });
      }

      const userMessages = parsed.messages.filter((m) => m.role !== 'system');
      const merged: ChatMessage[] = [...systemMessages, ...userMessages];

      const provider = createProvider(config);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Handle client disconnect
      req.on('close', () => {
        res.end();
      });

      try {
        const stream = provider.streamChat({
          messages: merged,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        });

        for await (const chunk of stream) {
          if (res.writableEnded) break;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }

        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        }
      } catch (streamError) {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' })}\n\n`,
          );
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  };

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
