import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../modules/user/user.model.js';
import type { UserRole } from '../modules/user/user.interface.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: UserRole };
    }
  }
}

/**
 * Authentication gate. Verifies the bearer token, blocks suspended
 * accounts, and updates `lastActiveAt` (best-effort, fire-and-forget) so
 * the admin panel's "active users" view is meaningful.
 *
 * Tokens issued before the `role` claim was introduced fall back to
 * 'user' — they're still valid but never grant admin access until the
 * user signs in again.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Missing or invalid Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
  if (payload.type !== 'access') {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token type'));
  }

  const role: UserRole = payload.role === 'admin' ? 'admin' : 'user';
  req.user = { id: payload.sub, email: payload.email, role };

  // Suspension check + activity ping. Single round-trip; result is needed
  // before we let the request pass.
  try {
    const account = await User.findByIdAndUpdate(
      payload.sub,
      { $set: { lastActiveAt: new Date() } },
      { new: false, projection: { suspended: 1, role: 1 } },
    ).lean();
    if (!account) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Account no longer exists'));
    }
    if (account.suspended) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Account is suspended'));
    }
    // Trust the DB role over the token role to defend against stale tokens
    // after an admin demotes a user.
    if (account.role) req.user.role = account.role;
  } catch (err) {
    return next(err);
  }

  next();
};

/**
 * Authorization gate. Must run AFTER `requireAuth`. Blocks any caller
 * whose `role` is not `admin` with a 403 (not 404) so the admin panel
 * can render an explicit "access denied" screen.
 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated'));
  }
  if (req.user.role !== 'admin') {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Admin privileges required'));
  }
  next();
};
