/**
 * Chat message Mongoose model - separate collection for scalability
 */
import { Schema, model } from 'mongoose';
import type { IChatMessageDocument, IChatMessageModel } from '@/modules/ai/chat-session.interface';

const chatMessageSchema = new Schema<IChatMessageDocument, IChatMessageModel>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat_Session',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'chat_messages',
  },
);

// Compound index for efficient session message queries
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export const ChatMessage = model<IChatMessageDocument, IChatMessageModel>(
  'Chat_Message',
  chatMessageSchema,
);
