import type { RequestHandler } from 'express';
import { z } from 'zod';

/**
 * Generic Zod request validator. Pass a schema with shape
 * { body?, query?, params? } and validated data is reassigned onto req.
 */
export const validate =
  (schema: z.ZodSchema): RequestHandler =>
  async (req, _res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Best-effort reassignment of validated payload
      if (parsed && typeof parsed === 'object') {
        const p = parsed as { body?: unknown; query?: unknown; params?: unknown };
        if (p.body) req.body = p.body;
        if (p.query) Object.assign(req.query, p.query);
        if (p.params) Object.assign(req.params, p.params);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
