import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const dailyPointsSchema = z.object({
  query: z.object({ from: dateString, to: dateString }),
});
