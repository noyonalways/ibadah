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
  context: z.string().max(16000).optional(),
  surface: z.enum(['landing', 'dashboard']).optional(),
  /**
   * Existing chat session to append to; omit/null to start a new one.
   * `.nullish()` accepts both `undefined` and `null` (the client sends
   * `null` for a brand-new conversation).
   */
  sessionId: z.string().min(1).max(64).nullish(),
});

export const adminChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  context: z.string().max(16000).optional(),
  /** Existing chat session to append to; omit/null to start a new one. */
  sessionId: z.string().min(1).max(64).nullish(),
});
