import { Types } from 'mongoose';
import type { Request } from 'express';

import { logger } from '../../utils/logger.js';
import { User } from '../user/user.model.js';
import { AuditEvent } from './audit.model.js';
import type { AuditAction, IAuditEvent } from './audit.interface.js';

interface RecordInput {
  actorId: string;
  action: AuditAction;
  target?: IAuditEvent['target'];
  diff?: IAuditEvent['diff'];
  reason?: string;
  context?: IAuditEvent['context'];
  ip?: string;
  userAgent?: string;
}

/**
 * Best-effort recording. If the actor is missing from the DB (rare —
 * usually means the seed admin was deleted mid-flight) we record the
 * event with whatever email/name we already had on the request, so the
 * trail stays continuous.
 *
 * Audit failures NEVER cascade: if the write fails we log and move on,
 * because the underlying business operation has already succeeded.
 */
async function record(input: RecordInput): Promise<void> {
  try {
    const user = await User.findById(input.actorId)
      .select('email name')
      .lean<{ _id: Types.ObjectId; email: string; name: string } | null>();

    await AuditEvent.create({
      actor: {
        id: new Types.ObjectId(input.actorId),
        email: user?.email ?? 'unknown@local',
        name: user?.name ?? 'Unknown',
        ip: input.ip,
        userAgent: input.userAgent,
      },
      action: input.action,
      target: input.target,
      diff: input.diff,
      reason: input.reason,
      context: input.context,
    });
  } catch (err) {
    logger.warn('audit: failed to record event', { err, action: input.action });
  }
}

/** Convenience helper that pulls IP/UA off an Express request. */
function recordFromRequest(req: Request, base: Omit<RecordInput, 'ip' | 'userAgent'>) {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip;
  const userAgent = req.headers['user-agent'];
  return record({ ...base, ip, userAgent });
}

interface ListInput {
  from?: string; // YYYY-MM-DD
  to?: string;
  actor?: string; // email or user id
  action?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListResult {
  items: ReturnType<typeof toApiShape>[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toApiShape(d: Record<string, unknown> & { _id: Types.ObjectId }) {
  return {
    id: d._id.toString(),
    actor: d.actor as IAuditEvent['actor'],
    action: d.action as AuditAction,
    target: d.target as IAuditEvent['target'],
    diff: d.diff as Record<string, unknown> | undefined,
    reason: d.reason as string | undefined,
    context: d.context as Record<string, unknown> | undefined,
    createdAt: d.createdAt as Date,
  };
}

async function list(input: ListInput): Promise<ListResult> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(200, Math.max(1, input.limit ?? 50));

  const filter: Record<string, unknown> = {};
  if (input.action) filter.action = input.action;

  if (input.actor) {
    const a = input.actor.trim();
    if (Types.ObjectId.isValid(a)) {
      filter['actor.id'] = new Types.ObjectId(a);
    } else {
      filter['actor.email'] = new RegExp(escapeRegex(a), 'i');
    }
  }

  if (input.from || input.to) {
    const dateFilter: Record<string, Date> = {};
    if (input.from) dateFilter.$gte = new Date(`${input.from}T00:00:00Z`);
    if (input.to) dateFilter.$lte = new Date(`${input.to}T23:59:59.999Z`);
    filter.createdAt = dateFilter;
  }

  if (input.search) {
    const rx = new RegExp(escapeRegex(input.search.trim()), 'i');
    filter.$or = [
      { 'actor.email': rx },
      { 'actor.name': rx },
      { action: rx },
      { 'target.label': rx },
      { 'target.id': rx },
      { reason: rx },
    ];
  }

  const [total, docs] = await Promise.all([
    AuditEvent.countDocuments(filter),
    AuditEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    items: docs.map((d) => toApiShape(d as unknown as Record<string, unknown> & { _id: Types.ObjectId })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function distinctActions(): Promise<string[]> {
  const out = await AuditEvent.distinct('action');
  return out.sort();
}

async function recentSummary(days = 30): Promise<{
  total: number;
  byAction: { action: string; count: number }[];
  byActor: { email: string; name: string; count: number }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, byAction, byActor] = await Promise.all([
    AuditEvent.countDocuments({ createdAt: { $gte: since } }),
    AuditEvent.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    AuditEvent.aggregate<{ _id: { email: string; name: string }; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { email: '$actor.email', name: '$actor.name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    total,
    byAction: byAction.map((r) => ({ action: r._id, count: r.count })),
    byActor: byActor.map((r) => ({
      email: r._id.email,
      name: r._id.name,
      count: r.count,
    })),
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const auditService = {
  record,
  recordFromRequest,
  list,
  distinctActions,
  recentSummary,
};
