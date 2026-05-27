import type { Document, Model, Types } from 'mongoose';

/**
 * A single privileged action recorded by the system. Audit events are
 * write-once; admins can only read them (never edit or delete) so the
 * trail is durable.
 *
 * `actor` is the admin who performed the action; `target` is the entity
 * affected (a user id, a habit id, etc). `diff` is an optional JSON blob
 * describing what changed (e.g. before/after of role).
 */
export type AuditAction =
  | 'user.update'
  | 'user.delete'
  | 'user.suspend'
  | 'user.unsuspend'
  | 'user.role.promote'
  | 'user.role.demote'
  | 'moderation.approve'
  | 'moderation.hide'
  | 'moderation.unhide'
  | 'moderation.remove'
  | 'defaults.update'
  | 'auth.admin.login'
  | 'auth.admin.logout';

export interface IAuditEvent {
  actor: {
    id: Types.ObjectId;
    email: string;
    name: string;
    ip?: string;
    userAgent?: string;
  };
  action: AuditAction;
  target?: {
    /** Concrete model name like 'User', 'Habit', etc (free-form). */
    type: string;
    id?: string;
    label?: string;
  };
  diff?: Record<string, unknown>;
  reason?: string;
  /** Free-form context — e.g. resource path that was hit. */
  context?: Record<string, unknown>;
  createdAt: Date;
}

export interface IAuditEventDocument extends IAuditEvent, Document {
  _id: Types.ObjectId;
}

export type IAuditEventModel = Model<IAuditEventDocument>;
