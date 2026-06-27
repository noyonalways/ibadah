/**
 * AI controller - handles chat and PDF generation endpoints
 */
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getAiConfig, AiConfigError } from '@/modules/ai/ai.config';
import { createProvider } from '@/modules/ai/providers/index';
import { getSystemPrompt } from '@/modules/ai/system-prompts';
import { PdfService } from '@/modules/ai/pdf.service';
import type { ChatMessage, SystemSurface } from '@/modules/ai/ai.types';
import {
  clientChatSchema,
  adminChatSchema,
  userPdfSchema,
  adminPdfSchema,
} from '@/modules/ai/ai.validation';

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
        config = await getAiConfig();
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
        config = await getAiConfig();
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

  /**
   * Client chat with tools endpoint - for regular users with function calling
   * POST /api/v1/ai/client/chat/tools
   */
  clientChatWithTools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { toolRegistry, toolExecutor } = await import('@/modules/ai/tools/index');
      const parsed = clientChatSchema.parse(req.body);

      let config;
      try {
        config = await getAiConfig();
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

      // Add tool definitions to system prompt
      const toolDefinitions = toolRegistry.getToolDefinitions('user');
      if (toolDefinitions.length > 0) {
        const toolsPrompt = `\n\nYou have access to the following tools:\n${JSON.stringify(toolDefinitions, null, 2)}\n\nWhen you need to use a tool, respond with a JSON object in this format:\n{"tool": "toolName", "arguments": {}}`;
        systemMessages[0].content += toolsPrompt;
      }

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

        let fullResponse = '';
        for await (const chunk of stream) {
          if (res.writableEnded) break;
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk }) }\n\n`);
        }

        // Check if the response contains a tool call
        try {
          const toolCallMatch = fullResponse.match(/\{[\s\S]*"tool"[\s\S]*\}/);
          if (toolCallMatch) {
            const toolCall = JSON.parse(toolCallMatch[0]);
            if (toolCall.tool && toolCall.arguments) {
              // Execute the tool
              const context = {
                userId: req.user!.id,
                userRole: req.user!.role as 'user' | 'admin',
                requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                timestamp: new Date(),
              };

              const result = await toolExecutor.execute(toolCall.tool, toolCall.arguments, context);
              
              res.write(`data: ${JSON.stringify({ type: 'tool_result', tool: toolCall.tool, result }) }\n\n`);
            }
          }
        } catch (toolError) {
          // Tool execution errors are logged but don't break the stream
          console.error('Tool execution error:', toolError);
        }

        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'done' }) }\n\n`);
          res.end();
        }
      } catch (streamError) {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' }) }\n\n`,
          );
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin chat with tools endpoint - for admin users with extended function calling
   * POST /api/v1/ai/admin/chat/tools
   */
  adminChatWithTools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { toolRegistry, toolExecutor } = await import('@/modules/ai/tools/index');
      const parsed = adminChatSchema.parse(req.body);

      let config;
      try {
        config = await getAiConfig();
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

      // Add all tool definitions (admin has access to all tools)
      const toolDefinitions = toolRegistry.getToolDefinitions('admin');
      if (toolDefinitions.length > 0) {
        const toolsPrompt = `\n\nYou have access to the following administrative tools:\n${JSON.stringify(toolDefinitions, null, 2)}\n\nWhen you need to use a tool, respond with a JSON object in this format:\n{"tool": "toolName", "arguments": {}}\n\nYou can invoke multiple tools in sequence if needed. Tool results will be provided to you for further analysis.`;
        systemMessages[0].content += toolsPrompt;
      }

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

        let fullResponse = '';
        for await (const chunk of stream) {
          if (res.writableEnded) break;
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk }) }\n\n`);
        }

        // Check if the response contains tool calls
        const toolCalls: Array<{ tool: string; arguments: Record<string, unknown> }> = [];
        try {
          // Match multiple tool calls in the response
          const toolCallMatches = fullResponse.matchAll(/\{[\s\S]*?"tool"[\s\S]*?"arguments"[\s\S]*?\}/g);
          for (const match of toolCallMatches) {
            try {
              const toolCall = JSON.parse(match[0]);
              if (toolCall.tool && toolCall.arguments) {
                toolCalls.push(toolCall);
              }
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        } catch (toolParseError) {
          console.error('Tool parsing error:', toolParseError);
        }

        // Execute tool calls if any
        if (toolCalls.length > 0) {
          const context = {
            userId: req.user!.id,
            userRole: req.user!.role as 'user' | 'admin',
            sessionId: req.body.sessionId,
            requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: new Date(),
          };

          res.write(`data: ${JSON.stringify({ type: 'tool_calls', count: toolCalls.length }) }\n\n`);

          for (const toolCall of toolCalls) {
            try {
              const result = await toolExecutor.execute(toolCall.tool, toolCall.arguments, context);
              
              res.write(`data: ${JSON.stringify({ 
                type: 'tool_result', 
                tool: toolCall.tool, 
                result: result.result,
                error: result.error,
              }) }\n\n`);
            } catch (toolError) {
              res.write(`data: ${JSON.stringify({ 
                type: 'tool_error', 
                tool: toolCall.tool, 
                error: (toolError as Error).message,
              }) }\n\n`);
            }
          }
        }

        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'done' }) }\n\n`);
          res.end();
        }
      } catch (streamError) {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' }) }\n\n`,
          );
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  };
}
