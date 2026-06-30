/**
 * Browser-side helper for talking to the server AI endpoint.
 * This is now a thin wrapper around the server API.
 */
import { streamAdminChat } from './ai-api';
import type { ChatRequestBody, StreamEvent } from './types';

export const AI_CHAT_ENDPOINT = '/api/ai/chat'; // Legacy, not used anymore

export interface StreamChatOptions {
  endpoint?: string;
  signal?: AbortSignal;
}

/**
 * @deprecated Use streamAdminChat from ai-api.ts directly
 */
export async function* streamChatRequest(
  body: ChatRequestBody,
  options: StreamChatOptions = {},
): AsyncIterable<StreamEvent> {
  // Forward to the new server-based API
  yield* streamAdminChat(body, { signal: options.signal });
}
