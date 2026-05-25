import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Missing or invalid Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token type'));
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
};
