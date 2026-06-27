/**
 * AI Tool Executor Service
 * 
 * Handles the execution of AI tools with proper context, error handling,
 * audit logging, and rate limiting.
 */

import { toolRegistry } from '@/modules/ai/tools/tool-registry';
import { auditService } from '@/modules/audit/audit.service';
import type { ToolContext, ToolResult } from '@/modules/ai/tools/ai-tools.types';

export interface ToolExecutionOptions {
  enableAuditLog?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  result?: unknown;
  error?: string;
  executionTimeMs: number;
  auditLogId?: string;
}

class ToolExecutor {
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 1;

  /**
   * Execute a single tool with full error handling and audit logging
   */
  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolContext,
    options: ToolExecutionOptions = {}
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const timeout = options.timeoutMs || this.defaultTimeout;
    const maxRetries = options.maxRetries ?? this.defaultRetries;

    // Get tool definition for audit
    const tool = toolRegistry.getTool(toolName);

    try {
      // Execute with timeout and retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.executeWithTimeout(
            toolName,
            args,
            context,
            timeout
          );

          const executionTimeMs = Date.now() - startTime;

          // Audit log if required
          if (options.enableAuditLog !== false && tool?.auditLog) {
            await this.createAuditLog(toolName, args, result, context, executionTimeMs);
          }

          return {
            success: true,
            toolName,
            result: result.result,
            executionTimeMs,
          };
        } catch (error) {
          lastError = error as Error;
          if (attempt < maxRetries) {
            // Exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }

      throw lastError;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      
      // Audit log failures too
      if (options.enableAuditLog !== false && tool?.auditLog) {
        await this.createAuditLog(toolName, args, null, context, executionTimeMs, (error as Error).message);
      }

      return {
        success: false,
        toolName,
        error: (error as Error).message,
        executionTimeMs,
      };
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeBatch(
    calls: Array<{ toolName: string; args: Record<string, unknown> }>,
    context: ToolContext,
    options: ToolExecutionOptions = {}
  ): Promise<ToolExecutionResult[]> {
    return Promise.all(
      calls.map(({ toolName, args }) =>
        this.execute(toolName, args, context, options)
      )
    );
  }

  /**
   * Execute a tool with a timeout
   */
  private async executeWithTimeout(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolContext,
    timeoutMs: number
  ): Promise<ToolResult> {
    return Promise.race([
      toolRegistry.executeTool(toolName, args, context),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Create an audit log entry for tool execution
   */
  private async createAuditLog(
    toolName: string,
    args: Record<string, unknown>,
    result: ToolResult | null,
    context: ToolContext,
    executionTimeMs: number,
    error?: string
  ): Promise<void> {
    try {
      await auditService.record({
        actorId: context.userId,
        action: 'ai.tool.execute',
        target: { type: 'ai_tool_execution', id: context.requestId, label: toolName },
        context: {
          toolName,
          arguments: args,
          result: result?.result,
          error: error || result?.error,
          executionTimeMs,
          sessionId: context.sessionId,
        },
      });
    } catch (err) {
      // Don't throw if audit logging fails - just log it
      console.error('Failed to create audit log:', err);
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const toolExecutor = new ToolExecutor();
