/**
 * Chat session service - handles CRUD operations for chat sessions and messages
 */
import type { Types } from 'mongoose';
import { ChatSession } from './chat-session.model.js';
import { ChatMessage } from './chat-message.model.js';
import type { IChatSessionDocument, IChatMessageDocument } from './chat-session.interface.js';

export class ChatSessionService {
  /**
   * Create a new chat session
   */
  async createSession(
    userId: Types.ObjectId | string,
    surface: 'landing' | 'dashboard' | 'admin',
    title: string = 'New Chat',
  ): Promise<IChatSessionDocument> {
    const session = new ChatSession({
      userId,
      title,
      surface,
      messageCount: 0,
      lastMessageAt: new Date(),
    });

    return session.save();
  }

  /**
   * Add a message to an existing session
   */
  async addMessage(
    sessionId: Types.ObjectId | string,
    role: 'system' | 'user' | 'assistant',
    content: string,
  ): Promise<IChatMessageDocument | null> {
    // Verify session exists
    const session = await ChatSession.findById(sessionId);
    if (!session) return null;

    // Create the message
    const message = new ChatMessage({
      sessionId,
      role,
      content,
    });

    await message.save();

    // Update session metadata
    session.messageCount += 1;
    session.lastMessageAt = new Date();

    // Auto-generate title from first user message if still "New Chat"
    if (session.title === 'New Chat' && role === 'user' && session.messageCount === 1) {
      session.title = content.slice(0, 50).trim();
      if (content.length > 50) {
        session.title += '...';
      }
    }

    await session.save();

    return message;
  }

  /**
   * Add multiple messages to a session (for batch updates)
   */
  async addMessages(
    sessionId: Types.ObjectId | string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<IChatMessageDocument[]> {
    // Verify session exists
    const session = await ChatSession.findById(sessionId);
    if (!session) return [];

    // Create all messages
    const messageDocuments = messages.map(
      (msg) =>
        new ChatMessage({
          sessionId,
          role: msg.role,
          content: msg.content,
        }),
    );

    const savedMessages = await ChatMessage.insertMany(messageDocuments);

    // Update session metadata
    session.messageCount += messages.length;
    session.lastMessageAt = new Date();

    // Auto-generate title from first user message if still "New Chat"
    if (session.title === 'New Chat' && session.messageCount === messages.length) {
      const firstUserMessage = messages.find((m) => m.role === 'user');
      if (firstUserMessage) {
        session.title = firstUserMessage.content.slice(0, 50).trim();
        if (firstUserMessage.content.length > 50) {
          session.title += '...';
        }
      }
    }

    await session.save();

    return savedMessages;
  }

  /**
   * Get all sessions for a user (sorted by most recent)
   */
  async getUserSessions(
    userId: Types.ObjectId | string,
    options?: {
      surface?: 'landing' | 'dashboard' | 'admin';
      limit?: number;
      skip?: number;
    },
  ): Promise<IChatSessionDocument[]> {
    const query = ChatSession.find({ userId });

    if (options?.surface) {
      query.where('surface').equals(options.surface);
    }

    query.sort({ lastMessageAt: -1 });

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.skip) {
      query.skip(options.skip);
    }

    return query.exec();
  }

  /**
   * Get a single session (without messages)
   */
  async getSession(
    sessionId: Types.ObjectId | string,
    userId?: Types.ObjectId | string,
  ): Promise<IChatSessionDocument | null> {
    const query = ChatSession.findById(sessionId);

    // Optional: verify ownership
    if (userId) {
      query.where('userId').equals(userId);
    }

    return query.exec();
  }

  /**
   * Get messages for a session
   */
  async getSessionMessages(
    sessionId: Types.ObjectId | string,
    options?: {
      limit?: number;
      skip?: number;
    },
  ): Promise<IChatMessageDocument[]> {
    const query = ChatMessage.find({ sessionId }).sort({ createdAt: 1 });

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.skip) {
      query.skip(options.skip);
    }

    return query.exec();
  }

  /**
   * Get session with messages (combined query)
   */
  async getSessionWithMessages(
    sessionId: Types.ObjectId | string,
    userId?: Types.ObjectId | string,
    options?: {
      messageLimit?: number;
      messageSkip?: number;
    },
  ): Promise<{ session: IChatSessionDocument; messages: IChatMessageDocument[] } | null> {
    const session = await this.getSession(sessionId, userId);
    if (!session) return null;

    const messages = await this.getSessionMessages(sessionId, {
      limit: options?.messageLimit,
      skip: options?.messageSkip,
    });

    return { session, messages };
  }

  /**
   * Update session title
   */
  async updateSessionTitle(
    sessionId: Types.ObjectId | string,
    title: string,
    userId?: Types.ObjectId | string,
  ): Promise<IChatSessionDocument | null> {
    const query: Record<string, unknown> = { _id: sessionId };
    if (userId) {
      query.userId = userId;
    }

    return ChatSession.findOneAndUpdate(
      query,
      { title: title.trim().slice(0, 200) },
      { new: true },
    );
  }

  /**
   * Delete a session and all its messages
   */
  async deleteSession(
    sessionId: Types.ObjectId | string,
    userId?: Types.ObjectId | string,
  ): Promise<boolean> {
    const query: Record<string, unknown> = { _id: sessionId };
    if (userId) {
      query.userId = userId;
    }

    // Delete session
    const sessionResult = await ChatSession.deleteOne(query);
    if (sessionResult.deletedCount === 0) return false;

    // Delete all messages for this session
    await ChatMessage.deleteMany({ sessionId });

    return true;
  }

  /**
   * Delete all sessions for a user and their messages
   */
  async deleteUserSessions(userId: Types.ObjectId | string): Promise<number> {
    // Get all session IDs for the user
    const sessions = await ChatSession.find({ userId }).select('_id');
    const sessionIds = sessions.map((s) => s._id);

    // Delete all messages for these sessions
    await ChatMessage.deleteMany({ sessionId: { $in: sessionIds } });

    // Delete all sessions
    const result = await ChatSession.deleteMany({ userId });
    return result.deletedCount;
  }

  /**
   * Get session count for a user
   */
  async getUserSessionCount(
    userId: Types.ObjectId | string,
    surface?: 'landing' | 'dashboard' | 'admin',
  ): Promise<number> {
    const query: Record<string, unknown> = { userId };
    if (surface) {
      query.surface = surface;
    }
    return ChatSession.countDocuments(query);
  }

  /**
   * Get the most recent session for a user
   */
  async getMostRecentSession(
    userId: Types.ObjectId | string,
    surface?: 'landing' | 'dashboard' | 'admin',
  ): Promise<IChatSessionDocument | null> {
    const query = ChatSession.findOne({ userId });

    if (surface) {
      query.where('surface').equals(surface);
    }

    query.sort({ lastMessageAt: -1 });

    return query.exec();
  }

  /**
   * Delete old messages for a session (keep only recent N messages)
   */
  async pruneSessionMessages(
    sessionId: Types.ObjectId | string,
    keepCount: number = 100,
  ): Promise<number> {
    // Get messages sorted by creation date (oldest first)
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .select('_id');

    if (messages.length <= keepCount) return 0;

    // Delete oldest messages
    const toDelete = messages.slice(0, messages.length - keepCount);
    const deleteIds = toDelete.map((m) => m._id);

    const result = await ChatMessage.deleteMany({ _id: { $in: deleteIds } });

    // Update session message count
    await ChatSession.findByIdAndUpdate(sessionId, {
      messageCount: keepCount,
    });

    return result.deletedCount;
  }
}
