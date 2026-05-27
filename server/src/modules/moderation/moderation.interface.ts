import type { Document, Model, Types } from 'mongoose';

/**
 * Moderation flags annotate user-generated content that requires admin
 * review. They are stored as their own collection (rather than fields on
 * the host record) so we can:
 *   - Independently track approve/hide/remove decisions and history.
 *   - Generate a single moderation queue across heterogeneous content
 *     types (habits, checklist items, dhikr entries, ...).
 *   - Run cheap counts/aggregates without scanning every host collection.
 *
 * The host content is referenced by `(targetType, targetId)` and we keep
 * a snapshot of the human-readable fields on the flag itself so the
 * queue is fast to render even after the host has been deleted.
 */
export type ModerationTargetType = 'habit' | 'checklist_item' | 'dhikr';
export type ModerationStatus = 'pending' | 'approved' | 'hidden' | 'removed';
export type ModerationReason =
  | 'profanity'
  | 'spam'
  | 'pii'
  | 'auto_long'
  | 'auto_repeated_chars'
  | 'auto_link_spam'
  | 'manual';

export interface IModerationFlag {
  targetType: ModerationTargetType;
  /** Compound key: for habits this is the habit id; for checklist/dhikr
   *  it is `${dayId}:${itemKey}` — see service for the keying scheme. */
  targetId: string;
  /** Owning user (the author of the content). */
  user: Types.ObjectId;
  /** Snapshot of the host content text, so queue stays meaningful even
   *  if the host record is mutated/deleted later. */
  contentSnapshot: string;
  /** Optional secondary text (e.g. habit description). */
  contextSnapshot?: string;
  reasons: ModerationReason[];
  status: ModerationStatus;
  /** Free-form note set by the admin who acted on this flag. */
  decisionNote?: string;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IModerationFlagDocument extends IModerationFlag, Document {
  _id: Types.ObjectId;
}

export type IModerationFlagModel = Model<IModerationFlagDocument>;
