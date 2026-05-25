import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface NormalizedError {
  statusCode: number;
  message: string;
  details?: unknown;
}

function normalize(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      details: err.flatten(),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: StatusCodes.BAD_REQUEST, message: `Invalid ${err.path}: ${err.value}` };
  }

  // Mongo duplicate key
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    return {
      statusCode: StatusCodes.CONFLICT,
      message: `Duplicate value for: ${Object.keys(keyValue).join(', ')}`,
    };
  }

  if (err instanceof Error) {
    return { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: err.message };
  }

  return { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Unknown error' };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { statusCode, message, details } = normalize(err);

  if (statusCode >= 500) {
    logger.error(err instanceof Error ? err.stack || err.message : String(err));
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV !== 'production' && err instanceof Error ? { stack: err.stack } : {}),
  });
};
