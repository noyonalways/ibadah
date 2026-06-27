/**
 * Chat session Mongoose model
 */
import { Schema, model } from 'mongoose';
import type { IChatSessionDocument, IChatSessionModel } from '@/modules/ai/chat-session.interface';

const chatSessionSchema = new Schema<IChatSessionDocument, IChatSessionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    surface: {
      type: String,
      enum: ['landing', 'dashboard', 'admin'],
      required: true,
      default: 'dashboard',
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessageAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'chat_sessions',
  },
);

// Compound index for efficient user session queries
chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

export const ChatSession = model<IChatSessionDocument, IChatSessionModel>(
  'Chat_Session',
  chatSessionSchema,
);
