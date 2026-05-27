import { z } from 'zod';

export const listModerationSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'approved', 'hidden', 'removed', 'all']).optional(),
    targetType: z.enum(['habit', 'checklist_item', 'dhikr']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const flagManualSchema = z.object({
  body: z.object({
    targetType: z.enum(['habit', 'checklist_item', 'dhikr']),
    targetId: z.string().trim().min(1).max(200),
    reason: z.string().trim().max(500).optional(),
  }),
});

export const decideSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    decision: z.enum(['approve', 'hide', 'remove', 'unhide']),
    note: z.string().trim().max(500).optional(),
  }),
});

export type ListModerationDto = z.infer<typeof listModerationSchema>['query'];
export type FlagManualDto = z.infer<typeof flagManualSchema>['body'];
export type DecideDto = z.infer<typeof decideSchema>['body'];
