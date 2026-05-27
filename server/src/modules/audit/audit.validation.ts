import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const listAuditSchema = z.object({
  query: z
    .object({
      from: dateString.optional(),
      to: dateString.optional(),
      actor: z.string().trim().max(120).optional(),
      action: z.string().trim().max(80).optional(),
      search: z.string().trim().max(120).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: '`from` must be before or equal to `to`',
    }),
});

export type ListAuditDto = z.infer<typeof listAuditSchema>['query'];
