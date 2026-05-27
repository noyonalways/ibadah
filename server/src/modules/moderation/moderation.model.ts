import { Schema, model } from 'mongoose';
import type {
  IModerationFlagDocument,
  IModerationFlagModel,
} from './moderation.interface.js';

const moderationFlagSchema = new Schema<IModerationFlagDocument, IModerationFlagModel>(
  {
    targetType: {
      type: String,
      required: true,
      enum: ['habit', 'checklist_item', 'dhikr'],
      index: true,
    },
    targetId: { type: String, required: true, trim: true, index: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentSnapshot: { type: String, required: true, trim: true, maxlength: 500 },
    contextSnapshot: { type: String, trim: true, maxlength: 500 },
    reasons: {
      type: [String],
      enum: [
        'profanity',
        'spam',
        'pii',
        'auto_long',
        'auto_repeated_chars',
        'auto_link_spam',
        'manual',
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden', 'removed'],
      default: 'pending',
      index: true,
    },
    decisionNote: { type: String, trim: true, maxlength: 500 },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
  },
  { timestamps: true },
);

// One pending flag per content unit — approve/hide collapses to a status
// change rather than spawning duplicates.
moderationFlagSchema.index(
  { targetType: 1, targetId: 1 },
  { unique: true },
);

export const ModerationFlag = model<IModerationFlagDocument, IModerationFlagModel>(
  'ModerationFlag',
  moderationFlagSchema,
);
