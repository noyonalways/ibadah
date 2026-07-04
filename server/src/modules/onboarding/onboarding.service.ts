import { Types } from 'mongoose';
import type { Request } from 'express';

import { User } from '@/modules/user/user.model';
import { OnboardingSubmission } from '@/modules/onboarding/onboarding.model';
import type {
  OnboardingFocus,
  OnboardingPersona,
} from '@/modules/onboarding/onboarding.interface';
import type {
  ListOnboardingDto,
  OnboardingSummaryDto,
  SubmitOnboardingDto,
} from '@/modules/onboarding/onboarding.validation';

function toApiShape(doc: {
  _id: Types.ObjectId;
  persona: OnboardingPersona;
  focus: OnboardingFocus[];
  locale: string;
  source: string;
  user?: Types.ObjectId;
  userEmail?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}) {
  return {
    id: String(doc._id),
    persona: doc.persona,
    focus: doc.focus,
    locale: doc.locale,
    source: doc.source,
    user: doc.user ? String(doc.user) : undefined,
    userEmail: doc.userEmail,
    userName: doc.userName,
    ip: doc.ip,
    userAgent: doc.userAgent,
    createdAt: doc.createdAt.toISOString(),
  };
}

function requestMeta(req: Request) {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip;
  const userAgent = req.headers['user-agent'];
  return { ip, userAgent };
}

async function submit(
  req: Request,
  body: SubmitOnboardingDto,
): Promise<ReturnType<typeof toApiShape>> {
  const { ip, userAgent } = requestMeta(req);
  let userEmail: string | undefined;
  let userName: string | undefined;
  let userId: Types.ObjectId | undefined;

  if (req.user?.id) {
    userId = new Types.ObjectId(req.user.id);
    const account = await User.findById(req.user.id)
      .select('email name')
      .lean<{ email: string; name: string } | null>();
    userEmail = account?.email ?? req.user.email;
    userName = account?.name;
  }

  const doc = await OnboardingSubmission.create({
    persona: body.persona,
    focus: body.focus,
    locale: body.locale,
    source: body.source ?? 'mobile_landing',
    user: userId,
    userEmail,
    userName,
    ip,
    userAgent,
  });

  return toApiShape(doc);
}

async function list(query: ListOnboardingDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const filter: Record<string, unknown> = {};

  if (query.persona) filter.persona = query.persona;
  if (query.locale) filter.locale = query.locale;

  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
    filter.createdAt = createdAt;
  }

  const [items, total] = await Promise.all([
    OnboardingSubmission.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OnboardingSubmission.countDocuments(filter),
  ]);

  return {
    items: items.map((d) =>
      toApiShape(d as Parameters<typeof toApiShape>[0]),
    ),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function summary(query: OnboardingSummaryDto) {
  const days = query.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, recent, byPersona, byLocale, focusAgg, linkedUsers] = await Promise.all([
    OnboardingSubmission.countDocuments(),
    OnboardingSubmission.countDocuments({ createdAt: { $gte: since } }),
    OnboardingSubmission.aggregate<{ _id: OnboardingPersona; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$persona', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OnboardingSubmission.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$locale', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OnboardingSubmission.aggregate<{ _id: OnboardingFocus; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$focus' },
      { $group: { _id: '$focus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OnboardingSubmission.countDocuments({
      createdAt: { $gte: since },
      user: { $exists: true, $ne: null },
    }),
  ]);

  return {
    days,
    total,
    recent,
    linkedUsers,
    anonymous: recent - linkedUsers,
    byPersona: byPersona.map((r) => ({ persona: r._id, count: r.count })),
    byLocale: byLocale.map((r) => ({ locale: r._id, count: r.count })),
    byFocus: focusAgg.map((r) => ({ focus: r._id, count: r.count })),
  };
}

export const onboardingService = {
  submit,
  list,
  summary,
};
