/**
 * Chat session interfaces for AI assistant conversations
 */
import type { Document, Model, Types } from 'mongoose';

export interface IChatSession {
  userId: Types.ObjectId;
  title: string;
  surface: 'landing' | 'dashboard' | 'admin';
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatSessionDocument extends IChatSession, Document {
  _id: Types.ObjectId;
}

export interface IChatSessionModel extends Model<IChatSessionDocument> {
  // Add any static methods here if needed
}

export interface IChatMessage {
  sessionId: Types.ObjectId;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IChatMessageDocument extends IChatMessage, Document {
  _id: Types.ObjectId;
}

export interface IChatMessageModel extends Model<IChatMessageDocument> {
  // Add any static methods here if needed
}
