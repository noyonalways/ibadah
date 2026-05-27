/**
 * Moderation service — produces a unified queue of flagged user content
 * across the three places people can author free-form text:
 *   - Habit definitions (Habit collection: name + description)
 *   - Checklist items (embedded in ChecklistDay.items[])
 *   - Dhikr entries  (embedded in DhikrDay.entries[])
 *
 * Strategy
 * ---------
 * 1. Auto-detection: a lightweight heuristic scan catches obvious things
 *    (very long titles, repeated character abuse, bare links) and creates
 *    `pending` ModerationFlag rows. This runs on demand from `runScan()`.
 *
 * 2. Manual flags: an admin can flag any individual habit/checklist/dhikr
 *    item with a reason. Same row, same status machine.
 *
 * 3. Decisions: an admin transitions a flag through `approved | hidden |
 *    removed`. Approving leaves host content alone; hiding and removing
 *    invoke the appropriate cascade on the host. Removed flags also wipe
 *    the host content (`Habit.archived = true`, item splice for embedded
 *    arrays).
 */
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/ApiError.js';
import { Habit } from '../habit/habit.model.js';
import { ChecklistDay } from '../checklist/checklist.model.js';
import { DhikrDay } from '../dhikr/dhikr.model.js';
import { User } from '../user/user.model.js';
import { ModerationFlag } from './moderation.model.js';
import type {
  ModerationReason,
  ModerationStatus,
  ModerationTargetType,
} from './moderation.interface.js';

/* ---------------------------- Heuristics ----------------------------- */

const PROFANITY_LIST = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'damn',
  'bastard',
];
const URL_RE = /\bhttps?:\/\/\S+/i;
const REPEATED_CHARS_RE = /(.)\1{4,}/i; // 5+ of the same char in a row
const PII_EMAIL_RE = /[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PII_PHONE_RE = /(?:\+?\d[\s-]?){10,}/;

function detectReasons(text: string): ModerationReason[] {
  const t = text.toLowerCase();
  const reasons: ModerationReason[] = [];
  if (text.length > 120) reasons.push('auto_long');
  if (REPEATED_CHARS_RE.test(t)) reasons.push('auto_repeated_chars');
  if (URL_RE.test(t)) reasons.push('auto_link_spam');
  if (PROFANITY_LIST.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
    reasons.push('profanity');
  }
  if (PII_EMAIL_RE.test(t) || PII_PHONE_RE.test(t)) reasons.push('pii');
  return reasons;
}

/* ----------------------------- Keying -------------------------------- */
/**
 * For embedded items (checklist, dhikr) we key by `dayId:slugOrIndex` so
 * a flag points to a stable spot in the array. This is the same key the
 * UI uses to take action on the host.
 */
function checklistKey(dayId: string, itemId: string | number): string {
  return `${dayId}:${itemId}`;
}
function dhikrKey(dayId: string, slug: string): string {
  return `${dayId}:${slug}`;
}

/* ---------------------------- Queue --------------------------------- */

interface ListFlagsInput {
  status?: ModerationStatus | 'all';
  targetType?: ModerationTargetType;
  page?: number;
  limit?: number;
}

interface FlagApiShape {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  contentSnapshot: string;
  contextSnapshot?: string;
  reasons: ModerationReason[];
  status: ModerationStatus;
  decisionNote?: string;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; email: string };
  decidedBy?: { id: string; name: string; email: string };
}

interface ListFlagsResult {
  items: FlagApiShape[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  counts: Record<ModerationStatus, number>;
  byType: Record<ModerationTargetType, number>;
}

async function listFlags(input: ListFlagsInput): Promise<ListFlagsResult> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 25));

  const filter: Record<string, unknown> = {};
  if (input.status && input.status !== 'all') filter.status = input.status;
  if (input.targetType) filter.targetType = input.targetType;

  const [total, docs, statusAgg, typeAgg] = await Promise.all([
    ModerationFlag.countDocuments(filter),
    ModerationFlag.find(filter)
      .populate('user', 'name email')
      .populate('decidedBy', 'name email')
      .sort({ status: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ModerationFlag.aggregate<{ _id: ModerationStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ModerationFlag.aggregate<{ _id: ModerationTargetType; count: number }>([
      { $match: { status: 'pending' } },
      { $group: { _id: '$targetType', count: { $sum: 1 } } },
    ]),
  ]);

  const counts: Record<ModerationStatus, number> = {
    pending: 0,
    approved: 0,
    hidden: 0,
    removed: 0,
  };
  for (const row of statusAgg) counts[row._id] = row.count;

  const byType: Record<ModerationTargetType, number> = {
    habit: 0,
    checklist_item: 0,
    dhikr: 0,
  };
  for (const row of typeAgg) byType[row._id] = row.count;

  const items: FlagApiShape[] = docs.map((d) => {
    const u = d.user as unknown as { _id: Types.ObjectId; name: string; email: string };
    const dec = d.decidedBy as unknown as
      | { _id: Types.ObjectId; name: string; email: string }
      | undefined;
    return {
      id: (d._id as Types.ObjectId).toString(),
      targetType: d.targetType,
      targetId: d.targetId,
      contentSnapshot: d.contentSnapshot,
      contextSnapshot: d.contextSnapshot,
      reasons: d.reasons ?? [],
      status: d.status,
      decisionNote: d.decisionNote,
      decidedAt: d.decidedAt,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
      user: u
        ? { id: u._id.toString(), name: u.name, email: u.email }
        : { id: '', name: '—', email: '—' },
      decidedBy: dec
        ? { id: dec._id.toString(), name: dec.name, email: dec.email }
        : undefined,
    };
  });

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts,
    byType,
  };
}

/* --------------------------- Auto-scan ------------------------------- */

interface ScanResult {
  scanned: { habits: number; checklistItems: number; dhikrEntries: number };
  flagged: { created: number; updated: number };
}

/**
 * Sweep all user-generated content and create / refresh flags. Idempotent
 * — re-running keeps existing decisions but updates the reason list and
 * snapshot for any still-pending entry.
 */
async function runScan(): Promise<ScanResult> {
  let created = 0;
  let updated = 0;
  let scannedHabits = 0;
  let scannedChecklistItems = 0;
  let scannedDhikr = 0;

  // -- Habits --
  const habits = await Habit.find({ archived: false })
    .select('_id name description user')
    .lean();
  scannedHabits = habits.length;
  for (const h of habits) {
    const text = h.name ?? '';
    const reasons = detectReasons(text);
    if (reasons.length === 0) continue;
    const hostId = (h._id as Types.ObjectId).toString();
    const r = await upsertFlag({
      targetType: 'habit',
      targetId: hostId,
      user: h.user as Types.ObjectId,
      contentSnapshot: text.slice(0, 500),
      contextSnapshot: (h.description ?? '').slice(0, 500),
      reasons,
    });
    if (r === 'created') created++;
    else if (r === 'updated') updated++;
  }

  // -- Checklist items --
  const days = await ChecklistDay.find({})
    .select('_id user items')
    .lean<{ _id: Types.ObjectId; user: Types.ObjectId; items: { _id?: Types.ObjectId; title: string }[] }[]>();
  for (const d of days) {
    for (const item of d.items ?? []) {
      scannedChecklistItems++;
      const text = item.title ?? '';
      const reasons = detectReasons(text);
      if (reasons.length === 0) continue;
      const itemKey = item._id ? item._id.toString() : text;
      const r = await upsertFlag({
        targetType: 'checklist_item',
        targetId: checklistKey(d._id.toString(), itemKey),
        user: d.user,
        contentSnapshot: text.slice(0, 500),
        reasons,
      });
      if (r === 'created') created++;
      else if (r === 'updated') updated++;
    }
  }

  // -- Dhikr entries --
  const dhikrDays = await DhikrDay.find({})
    .select('_id user entries')
    .lean<{ _id: Types.ObjectId; user: Types.ObjectId; entries: { slug: string; label: string }[] }[]>();
  for (const d of dhikrDays) {
    for (const e of d.entries ?? []) {
      scannedDhikr++;
      const text = `${e.label ?? ''} ${e.slug ?? ''}`.trim();
      const reasons = detectReasons(text);
      if (reasons.length === 0) continue;
      const r = await upsertFlag({
        targetType: 'dhikr',
        targetId: dhikrKey(d._id.toString(), e.slug),
        user: d.user,
        contentSnapshot: (e.label || e.slug || '').slice(0, 500),
        reasons,
      });
      if (r === 'created') created++;
      else if (r === 'updated') updated++;
    }
  }

  return {
    scanned: {
      habits: scannedHabits,
      checklistItems: scannedChecklistItems,
      dhikrEntries: scannedDhikr,
    },
    flagged: { created, updated },
  };
}

async function upsertFlag(input: {
  targetType: ModerationTargetType;
  targetId: string;
  user: Types.ObjectId;
  contentSnapshot: string;
  contextSnapshot?: string;
  reasons: ModerationReason[];
}): Promise<'created' | 'updated' | 'unchanged'> {
  const existing = await ModerationFlag.findOne({
    targetType: input.targetType,
    targetId: input.targetId,
  });

  if (!existing) {
    await ModerationFlag.create({ ...input, status: 'pending' });
    return 'created';
  }

  // Don't reset already-decided entries — only refresh metadata on
  // pending ones so the queue mirrors the latest content.
  if (existing.status === 'pending') {
    existing.contentSnapshot = input.contentSnapshot;
    existing.contextSnapshot = input.contextSnapshot;
    existing.reasons = Array.from(new Set([...existing.reasons, ...input.reasons]));
    await existing.save();
    return 'updated';
  }
  return 'unchanged';
}

/* ----------------------------- Manual flag --------------------------- */

async function flagManually(input: {
  targetType: ModerationTargetType;
  targetId: string;
  reason?: string;
  actorId: string;
}): Promise<FlagApiShape> {
  // We need to know who owns the content + a reasonable snapshot.
  const snapshot = await snapshotForTarget(input.targetType, input.targetId);
  if (!snapshot) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Target content not found');
  }
  const flag = await ModerationFlag.findOneAndUpdate(
    { targetType: input.targetType, targetId: input.targetId },
    {
      $set: {
        user: snapshot.user,
        contentSnapshot: snapshot.content,
        contextSnapshot: snapshot.context,
        status: 'pending',
        decisionNote: input.reason,
      },
      $addToSet: { reasons: 'manual' },
      $setOnInsert: {
        targetType: input.targetType,
        targetId: input.targetId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .populate('user', 'name email')
    .populate('decidedBy', 'name email');

  void input.actorId;
  return shape(flag!);
}

async function snapshotForTarget(
  targetType: ModerationTargetType,
  targetId: string,
): Promise<{ user: Types.ObjectId; content: string; context?: string } | null> {
  if (targetType === 'habit') {
    if (!Types.ObjectId.isValid(targetId)) return null;
    const h = await Habit.findById(targetId).select('user name description').lean<{
      user: Types.ObjectId;
      name: string;
      description?: string;
    } | null>();
    if (!h) return null;
    return { user: h.user, content: h.name, context: h.description };
  }
  if (targetType === 'checklist_item') {
    const [dayId, itemKey] = targetId.split(':');
    if (!dayId || !Types.ObjectId.isValid(dayId)) return null;
    const d = await ChecklistDay.findById(dayId)
      .select('user items')
      .lean<{
        user: Types.ObjectId;
        items: { _id?: Types.ObjectId; title: string }[];
      } | null>();
    if (!d) return null;
    const item = d.items.find(
      (i) => (i._id ? i._id.toString() : i.title) === itemKey,
    );
    if (!item) return null;
    return { user: d.user, content: item.title };
  }
  if (targetType === 'dhikr') {
    const [dayId, slug] = targetId.split(':');
    if (!dayId || !slug || !Types.ObjectId.isValid(dayId)) return null;
    const d = await DhikrDay.findById(dayId)
      .select('user entries')
      .lean<{
        user: Types.ObjectId;
        entries: { slug: string; label: string }[];
      } | null>();
    if (!d) return null;
    const e = d.entries.find((x) => x.slug === slug);
    if (!e) return null;
    return { user: d.user, content: e.label || e.slug };
  }
  return null;
}

function shape(d: {
  _id: Types.ObjectId;
  targetType: ModerationTargetType;
  targetId: string;
  contentSnapshot: string;
  contextSnapshot?: string;
  reasons: ModerationReason[];
  status: ModerationStatus;
  decisionNote?: string;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: unknown;
  decidedBy?: unknown;
}): FlagApiShape {
  const u = d.user as { _id: Types.ObjectId; name: string; email: string } | undefined;
  const dec = d.decidedBy as
    | { _id: Types.ObjectId; name: string; email: string }
    | undefined;
  return {
    id: d._id.toString(),
    targetType: d.targetType,
    targetId: d.targetId,
    contentSnapshot: d.contentSnapshot,
    contextSnapshot: d.contextSnapshot,
    reasons: d.reasons ?? [],
    status: d.status,
    decisionNote: d.decisionNote,
    decidedAt: d.decidedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    user: u
      ? { id: u._id.toString(), name: u.name, email: u.email }
      : { id: '', name: '—', email: '—' },
    decidedBy: dec
      ? { id: dec._id.toString(), name: dec.name, email: dec.email }
      : undefined,
  };
}

/* ----------------------------- Decisions ---------------------------- */

async function decide(
  flagId: string,
  decision: 'approve' | 'hide' | 'remove' | 'unhide',
  actorId: string,
  note?: string,
): Promise<FlagApiShape> {
  if (!Types.ObjectId.isValid(flagId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid flag id');
  }
  const flag = await ModerationFlag.findById(flagId);
  if (!flag) throw new ApiError(StatusCodes.NOT_FOUND, 'Flag not found');

  let newStatus: ModerationStatus;
  if (decision === 'approve') newStatus = 'approved';
  else if (decision === 'hide') newStatus = 'hidden';
  else if (decision === 'unhide') newStatus = 'pending';
  else newStatus = 'removed';

  if (decision === 'remove') {
    await applyRemoveCascade(flag.targetType, flag.targetId);
  } else if (decision === 'hide') {
    await applyHideCascade(flag.targetType, flag.targetId);
  } else if (decision === 'unhide') {
    await applyUnhideCascade(flag.targetType, flag.targetId);
  }

  flag.status = newStatus;
  flag.decisionNote = note;
  flag.decidedBy = new Types.ObjectId(actorId);
  flag.decidedAt = new Date();
  await flag.save();

  await flag.populate('user', 'name email');
  await flag.populate('decidedBy', 'name email');
  return shape(flag.toObject() as Parameters<typeof shape>[0]);
}

async function applyHideCascade(
  type: 'habit' | 'checklist_item' | 'dhikr',
  targetId: string,
): Promise<void> {
  if (type === 'habit') {
    if (Types.ObjectId.isValid(targetId)) {
      await Habit.updateOne({ _id: targetId }, { $set: { archived: true } });
    }
    return;
  }
  // For embedded items, "hide" is a soft signal recorded on the flag —
  // the host stays intact so historical totals remain consistent. The
  // admin queue UI labels this clearly.
}

async function applyUnhideCascade(
  type: 'habit' | 'checklist_item' | 'dhikr',
  targetId: string,
): Promise<void> {
  if (type === 'habit') {
    if (Types.ObjectId.isValid(targetId)) {
      await Habit.updateOne({ _id: targetId }, { $set: { archived: false } });
    }
  }
}

async function applyRemoveCascade(
  type: 'habit' | 'checklist_item' | 'dhikr',
  targetId: string,
): Promise<void> {
  if (type === 'habit') {
    if (Types.ObjectId.isValid(targetId)) {
      await Habit.updateOne(
        { _id: targetId },
        {
          $set: {
            archived: true,
            name: '[removed by moderator]',
            description: '',
          },
        },
      );
    }
    return;
  }
  if (type === 'checklist_item') {
    const [dayId, itemKey] = targetId.split(':');
    if (!dayId || !Types.ObjectId.isValid(dayId)) return;
    const d = await ChecklistDay.findById(dayId);
    if (!d) return;
    type CDItem = { _id?: Types.ObjectId; title: string };
    const items = d.items as unknown as CDItem[];
    const idx = items.findIndex(
      (i) => (i._id ? i._id.toString() : i.title) === itemKey,
    );
    if (idx >= 0) {
      items[idx].title = '[removed by moderator]';
      await d.save();
    }
    return;
  }
  if (type === 'dhikr') {
    const [dayId, slug] = targetId.split(':');
    if (!dayId || !slug || !Types.ObjectId.isValid(dayId)) return;
    const d = await DhikrDay.findById(dayId);
    if (!d) return;
    type DEntry = { slug: string; label: string };
    const entries = d.entries as unknown as DEntry[];
    const idx = entries.findIndex((e) => e.slug === slug);
    if (idx >= 0) {
      entries[idx].label = '[removed by moderator]';
      await d.save();
    }
  }
}

/* --------------------------- Stats / overview ----------------------- */

async function overview(): Promise<{
  pending: number;
  approved: number;
  hidden: number;
  removed: number;
  pendingByType: { habit: number; checklist_item: number; dhikr: number };
  recentActors: { id: string; name: string; email: string; count: number }[];
}> {
  const [statusAgg, typeAgg, actorAgg] = await Promise.all([
    ModerationFlag.aggregate<{ _id: ModerationStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ModerationFlag.aggregate<{ _id: 'habit' | 'checklist_item' | 'dhikr'; count: number }>([
      { $match: { status: 'pending' } },
      { $group: { _id: '$targetType', count: { $sum: 1 } } },
    ]),
    ModerationFlag.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { status: 'pending' } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const counts: Record<ModerationStatus, number> = {
    pending: 0,
    approved: 0,
    hidden: 0,
    removed: 0,
  };
  for (const r of statusAgg) counts[r._id] = r.count;

  const pendingByType = { habit: 0, checklist_item: 0, dhikr: 0 };
  for (const r of typeAgg) pendingByType[r._id] = r.count;

  const recentActors: { id: string; name: string; email: string; count: number }[] = [];
  if (actorAgg.length > 0) {
    const users = await User.find({ _id: { $in: actorAgg.map((a) => a._id) } })
      .select('name email')
      .lean<{ _id: Types.ObjectId; name: string; email: string }[]>();
    const byId = new Map(users.map((u) => [u._id.toString(), u]));
    for (const a of actorAgg) {
      const u = byId.get(a._id.toString());
      if (u)
        recentActors.push({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          count: a.count,
        });
    }
  }

  return {
    pending: counts.pending,
    approved: counts.approved,
    hidden: counts.hidden,
    removed: counts.removed,
    pendingByType,
    recentActors,
  };
}

export const moderationService = {
  listFlags,
  flagManually,
  decide,
  runScan,
  overview,
};
