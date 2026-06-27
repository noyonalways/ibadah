/**
 * AI Tool Registry
 * 
 * Manages registration and lookup of AI tools for both client and admin users.
 */

import { clientTools } from '@/modules/ai/tools/client-tools';
import { adminTools } from '@/modules/ai/tools/admin-tools';
import type { 
  ToolRegistryEntry, 
  ToolDefinition, 
  ToolContext,
  ToolResult 
} from '@/modules/ai/tools/ai-tools.types';

class ToolRegistry {
  private tools: Map<string, ToolRegistryEntry> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    // Register client tools (available to regular users)
    for (const tool of clientTools) {
      this.tools.set(tool.definition.name, tool);
    }

    // Register admin tools (require admin privileges)
    for (const tool of adminTools) {
      this.tools.set(tool.definition.name, tool);
    }
  }

  /**
   * Get all tool definitions for a given user role
   */
  getToolDefinitions(userRole: 'user' | 'admin'): ToolDefinition[] {
    const definitions: ToolDefinition[] = [];
    
    for (const entry of this.tools.values()) {
      // Skip admin tools for regular users
      if (userRole === 'user' && entry.requireAdmin) {
        continue;
      }
      definitions.push(entry.definition);
    }

    return definitions;
  }

  /**
   * Get a specific tool entry
   */
  getTool(name: string): ToolRegistryEntry | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    name: string, 
    args: Record<string, unknown>, 
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return {
        toolCallId: context.requestId,
        error: `Tool '${name}' not found`,
        result: null,
      };
    }

    // Check admin permission
    if (tool.requireAdmin && context.userRole !== 'admin') {
      return {
        toolCallId: context.requestId,
        error: `Tool '${name}' requires admin privileges`,
        result: null,
      };
    }

    try {
      const result = await tool.handler(args, context);
      return {
        toolCallId: context.requestId,
        result,
      };
    } catch (error) {
      return {
        toolCallId: context.requestId,
        error: (error as Error).message,
        result: null,
      };
    }
  }

  /**
   * Register a custom tool
   */
  registerTool(entry: ToolRegistryEntry): void {
    this.tools.set(entry.definition.name, entry);
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all available tool names for a user role
   */
  getAvailableTools(userRole: 'user' | 'admin'): string[] {
    const tools: string[] = [];
    for (const [name, entry] of this.tools) {
      if (!entry.requireAdmin || userRole === 'admin') {
        tools.push(name);
      }
    }
    return tools;
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
