/**
 * AI Tools Type Definitions
 * 
 * Defines the structure for AI function calling capabilities,
 * enabling the AI to perform actions like querying data and managing resources.
 */

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ToolContext {
  userId: string;
  userRole: 'user' | 'admin';
  sessionId?: string;
  requestId: string;
  timestamp: Date;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolContext
) => Promise<unknown>;

export interface ToolRegistryEntry {
  definition: ToolDefinition;
  handler: ToolHandler;
  requireAdmin?: boolean;
  auditLog?: boolean;
}
