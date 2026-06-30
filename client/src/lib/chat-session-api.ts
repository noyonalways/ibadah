/**
 * API client for chat session management
 */
import { api } from './api';
import { authStorage } from './auth-storage';

const API_BASE = '/ai/client/sessions';

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
 * Get all chat sessions for the current user
 */
export async function getChatSessions(
  surface?: 'landing' | 'dashboard' | 'admin',
): Promise<{ sessions: ChatSession[]; hasMore: boolean }> {
  const token = authStorage.getAccess();
  const query = surface ? `?surface=${encodeURIComponent(surface)}` : '';
  const data = await api<{
    sessions: ChatSession[];
    pagination: { hasMore: boolean };
  }>(`${API_BASE}${query}`, {
    token,
  });
  return { sessions: data.sessions, hasMore: data.pagination.hasMore };
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  surface: 'dashboard' | 'admin' = 'dashboard',
  title?: string,
): Promise<ChatSession> {
  const token = authStorage.getAccess();
  const data = await api<ChatSession>(API_BASE, {
    method: 'POST',
    body: { surface, title },
    token,
  });
  return data;
}

/**
 * Get a single chat session with all messages
 */
export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionWithMessages> {
  const token = authStorage.getAccess();
  const data = await api<ChatSessionWithMessages>(`${API_BASE}/${sessionId}`, {
    token,
  });
  return data;
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const token = authStorage.getAccess();
  await api<void>(`${API_BASE}/${sessionId}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Update session title
 */
export async function updateChatSessionTitle(
  sessionId: string,
  title: string,
): Promise<ChatSession> {
  const token = authStorage.getAccess();
  const data = await api<ChatSession>(`${API_BASE}/${sessionId}`, {
    method: 'PATCH',
    body: { title },
    token,
  });
  return data;
}