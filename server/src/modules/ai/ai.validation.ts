/**
 * Validation schemas for AI endpoints
 */
import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(8000),
});

export const clientChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  context: z.string().max(4000).optional(),
  surface: z.enum(['landing', 'dashboard']).optional(),
  /** Existing chat session to append to; omit to start a new one. */
  sessionId: z.string().min(1).max(64).optional(),
});

export const adminChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  context: z.string().max(8000).optional(),
  /** Existing chat session to append to; omit to start a new one. */
  sessionId: z.string().min(1).max(64).optional(),
});

export const userPdfSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeCharts: z.boolean().optional(),
  locale: z.string().optional(),
});

export const adminPdfSchema = z.object({
  reportType: z.enum(['analytics', 'users', 'moderation', 'audit']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  filters: z.record(z.unknown()).optional(),
});

export const toolExecuteSchema = z.object({
  tool: z.string().min(1).max(100),
  arguments: z.record(z.unknown()).optional(),
});
