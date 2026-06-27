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
  ToolParameter,
  ToolContext,
  ToolResult,
} from '@/modules/ai/tools/ai-tools.types';
import type { ToolSpec } from '@/modules/ai/ai.types';

/**
 * Convert an internal `ToolParameter` into a clean JSON-Schema node that
 * every provider (OpenAI/Anthropic/Gemini) accepts. We deliberately drop
 * the non-standard per-property `required` flag — the parent object's
 * `required` array is the source of truth.
 */
function toSchemaNode(param: ToolParameter): Record<string, unknown> {
  const node: Record<string, unknown> = {
    type: param.type,
    description: param.description,
  };
  if (param.enum) node.enum = param.enum;
  if (param.items) node.items = toSchemaNode(param.items);
  if (param.properties) {
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(param.properties)) {
      props[key] = toSchemaNode(value);
    }
    node.properties = props;
  }
  return node;
}

function toToolSpec(definition: ToolDefinition): ToolSpec {
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(definition.parameters.properties)) {
    properties[key] = toSchemaNode(value);
  }
  return {
    name: definition.name,
    description: definition.description,
    parameters: {
      type: 'object',
      properties,
      required: definition.parameters.required ?? [],
    },
  };
}

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
   * Get provider-agnostic tool specs (JSON-Schema) for a given role.
   * This is what the agent orchestrator hands to the model.
   */
  getToolSpecs(userRole: 'user' | 'admin'): ToolSpec[] {
    return this.getToolDefinitions(userRole).map(toToolSpec);
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
