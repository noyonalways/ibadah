import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().trim().max(120).optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.enum(['newest', 'oldest', 'lastActive']).optional(),
  }),
});

export const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      role: z.enum(['user', 'admin']).optional(),
      suspended: z.boolean().optional(),
      name: z.string().trim().min(1).max(80).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

export const leaderboardSchema = z.object({
  query: z
    .object({
      from: dateString.optional(),
      to: dateString.optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: '`from` must be before or equal to `to`',
    }),
});

export const activeUsersSchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const analyticsRangeSchema = z.object({
  query: z
    .object({
      from: dateString.optional(),
      to: dateString.optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: '`from` must be before or equal to `to`',
    }),
});

export const userAnalyticsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z
    .object({
      from: dateString.optional(),
      to: dateString.optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: '`from` must be before or equal to `to`',
    }),
});

const habitDefaultSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  rewardPoints: z.coerce.number().int().min(-100).max(100).default(5),
  color: z.string().trim().max(40).optional(),
  icon: z.string().trim().max(40).optional(),
});

const checklistDefaultSchema = z.object({
  title: z.string().trim().min(1).max(200),
  rewardPoints: z.coerce.number().int().min(-100).max(100).default(5),
});

const dhikrDefaultSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'slug may only contain a-z, 0-9 and dashes'),
  label: z.string().trim().min(1).max(80),
  arabic: z.string().trim().max(200).optional(),
  defaultTarget: z.coerce.number().int().min(1).max(10000).default(33),
});

export const updateDefaultsSchema = z.object({
  body: z.object({
    habits: z.array(habitDefaultSchema).max(50),
    checklist: z.array(checklistDefaultSchema).max(50),
    dhikr: z.array(dhikrDefaultSchema).max(50),
  }),
});

export type ListUsersDto = z.infer<typeof listUsersSchema>['query'];
export type UpdateUserDto = z.infer<typeof updateUserSchema>['body'];
export type LeaderboardDto = z.infer<typeof leaderboardSchema>['query'];
export type ActiveUsersDto = z.infer<typeof activeUsersSchema>['query'];
export type UpdateDefaultsDto = z.infer<typeof updateDefaultsSchema>['body'];
export type AnalyticsRangeDto = z.infer<typeof analyticsRangeSchema>['query'];
export type UserAnalyticsDto = z.infer<typeof userAnalyticsSchema>['query'];
