/**
 * API client for chat session management (admin surface). Mirrors
 * `client/src/lib/chat-session-api.ts` — the admin `api` helper attaches
 * the bearer token automatically.
 */
import { api } from '../api';

const API_BASE = '/ai/admin/sessions';

export interface ChatSession {
  id: string;
  title: string;
  surface: 'landing' | 'dashboard' | 'admin';
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

/**
 * Get all chat sessions for the current operator.
 */
export async function getChatSessions(
  surface: 'landing' | 'dashboard' | 'admin' = 'admin',
): Promise<{ sessions: ChatSession[]; hasMore: boolean }> {
  const query = surface ? `?surface=${encodeURIComponent(surface)}` : '';
  const data = await api<{
    sessions: ChatSession[];
    pagination: { hasMore: boolean };
  }>(`${API_BASE}${query}`);
  return { sessions: data.sessions, hasMore: data.pagination.hasMore };
}

/**
 * Create a new chat session.
 */
export async function createChatSession(
  surface: 'dashboard' | 'admin' = 'admin',
  title?: string,
): Promise<ChatSession> {
  return api<ChatSession>(API_BASE, {
    method: 'POST',
    body: { surface, title },
  });
}

/**
 * Get a single chat session with all messages.
 */
export async function getChatSession(sessionId: string): Promise<ChatSessionWithMessages> {
  return api<ChatSessionWithMessages>(`${API_BASE}/${sessionId}`);
}

/**
 * Delete a chat session.
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await api<void>(`${API_BASE}/${sessionId}`, { method: 'DELETE' });
}

/**
 * Update a session's title.
 */
export async function updateChatSessionTitle(
  sessionId: string,
  title: string,
): Promise<ChatSession> {
  return api<ChatSession>(`${API_BASE}/${sessionId}`, {
    method: 'PATCH',
    body: { title },
  });
}
