/**
 * AI Tools API for Client
 * 
 * Provides client-side access to AI tool execution and context building.
 */

import { authStorage } from '../auth-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

/**
 * Get available tools for the current user
 */
export async function getAvailableTools(): Promise<ToolDefinition[]> {
  const token = authStorage.getAccess();
  
  const res = await fetch(`${API_BASE}/ai/tools`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch tools: ${res.status}`);
  }

  const data = await res.json();
  return data.tools || [];
}

/**
 * Execute a tool on the server
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const token = authStorage.getAccess();
  
  const res = await fetch(`${API_BASE}/ai/tools/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ tool: toolName, arguments: args }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Tool execution failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Build user context for AI chat
 */
export function buildUserContext(
  stats: {
    totalPoints?: number;
    currentStreak?: number;
    longestStreak?: number;
    activeDays?: number;
  },
  recentActivity?: Array<{
    date: string;
    total: number;
  }>
): string {
  const parts: string[] = [];
  
  if (stats.totalPoints !== undefined) {
    parts.push(`Total Points: ${stats.totalPoints}`);
  }
  if (stats.currentStreak !== undefined) {
    parts.push(`Current Streak: ${stats.currentStreak} days`);
  }
  if (stats.longestStreak !== undefined) {
    parts.push(`Longest Streak: ${stats.longestStreak} days`);
  }
  if (stats.activeDays !== undefined) {
    parts.push(`Active Days: ${stats.activeDays}`);
  }
  
  if (recentActivity && recentActivity.length > 0) {
    parts.push('\nRecent Activity:');
    recentActivity.slice(-7).forEach(day => {
      parts.push(`  ${day.date}: ${day.total} points`);
    });
  }
  
  return parts.join('\n');
}
