/**
 * AI Tools controller — exposes the tool catalog and a direct execution
 * endpoint. Used by clients that want to introspect available tools or
 * run a single tool outside of the chat loop.
 */
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { toolRegistry } from '@/modules/ai/tools/tool-registry';
import { toolExecutor } from '@/modules/ai/tools/tool-executor';
import { toolExecuteSchema } from '@/modules/ai/ai.validation';
import type { ToolContext } from '@/modules/ai/tools/ai-tools.types';

export class ToolsController {
  /**
   * GET /api/v1/ai/tools
   * List the tools available to the authenticated user's role.
   */
  listTools = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const role = (req.user?.role as 'user' | 'admin') ?? 'user';
      const tools = toolRegistry.getToolSpecs(role);
      res.status(StatusCodes.OK).json({ success: true, tools });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/ai/tools/execute
   * Execute a single tool directly. Admin-only tools are gated by the
   * registry based on the caller's role.
   */
  executeTool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = toolExecuteSchema.parse(req.body);
      const role = (req.user?.role as 'user' | 'admin') ?? 'user';

      const context: ToolContext = {
        userId: req.user!.id,
        userRole: role,
        requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
      };

      const exec = await toolExecutor.execute(parsed.tool, parsed.arguments ?? {}, context);

      res.status(exec.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST).json({
        toolCallId: context.requestId,
        tool: exec.toolName,
        result: exec.result ?? null,
        error: exec.error,
        executionTimeMs: exec.executionTimeMs,
      });
    } catch (error) {
      next(error);
    }
  };
}
