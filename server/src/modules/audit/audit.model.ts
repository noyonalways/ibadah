import { Schema, model } from 'mongoose';
import type { IAuditEventDocument, IAuditEventModel } from '@/modules/audit/audit.interface';

const actorSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true, maxlength: 400 },
  },
  { _id: false },
);

const targetSchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    id: { type: String, trim: true },
    label: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const auditEventSchema = new Schema<IAuditEventDocument, IAuditEventModel>(
  {
    actor: { type: actorSchema, required: true },
    action: { type: String, required: true, index: true, trim: true },
    target: { type: targetSchema },
    diff: { type: Schema.Types.Mixed },
    reason: { type: String, trim: true, maxlength: 500 },
    context: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    // Audit trail is append-only. We never $set, $unset, or remove docs
    // from the application code path.
    minimize: false,
    collection: 'audit_events',
  },
);

// Common query patterns: by actor, by action, by date range.
auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ 'actor.id': 1, createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });

export const AuditEvent = model<IAuditEventDocument, IAuditEventModel>(
  'Audit_Event',
  auditEventSchema,
);
