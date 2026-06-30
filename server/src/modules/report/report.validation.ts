/**
 * Validation schemas for report (PDF) endpoints.
 */
import { z } from 'zod';

export const userReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeCharts: z.boolean().optional(),
  locale: z.string().optional(),
});

export const adminReportSchema = z.object({
  reportType: z.enum(['analytics', 'users', 'moderation', 'audit']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  filters: z.record(z.unknown()).optional(),
});
