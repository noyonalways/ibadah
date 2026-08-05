import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@/utils/logger';

const notFoundLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn(
      `[NotFoundLimiter] 404 rate limit exceeded on ${req.method} ${req.originalUrl} (IP: ${req.ip})`,
    );
    res.status(options.statusCode).json(options.message);
  },
  message: {
    success: false,
    message: 'Too many non-existent route requests. Please try again later.',
  },
});

export const notFound: RequestHandler = (req, res) => {
  notFoundLimiter(req, res, () => {
    logger.warn(`[NotFound] Route not found: ${req.method} ${req.originalUrl} (IP: ${req.ip})`);
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });
};
