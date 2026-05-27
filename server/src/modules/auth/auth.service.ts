import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { OAuth2Client } from 'google-auth-library';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.js';
import { User } from '../user/user.model.js';
import type { IUserDocument, SafeUser, UserRole } from '../user/user.interface.js';
import { defaultsService } from '../admin/defaults.service.js';
import { Habit } from '../habit/habit.model.js';
import type { GoogleAuthDto, LoginDto, RegisterDto } from './auth.validation.js';

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

function buildAuthResult(user: IUserDocument): AuthResult {
  const safe = user.toSafeJSON();
  const accessToken = signAccessToken({ sub: safe.id, email: safe.email, role: safe.role });
  const refreshToken = signRefreshToken({ sub: safe.id, email: safe.email, role: safe.role });
  return { user: safe, accessToken, refreshToken };
}

/**
 * Apply admin-managed starter content to a newly created user.
 *
 * Critical: the data is **copied**, not referenced. After signup, the
 * user is free to add, edit, or delete any of these — they're seeds,
 * not constraints. (This honours the "users are not forced to follow
 * admin defaults" requirement.)
 */
async function seedNewUserContent(userId: IUserDocument['_id']): Promise<void> {
  try {
    const defaults = await defaultsService.get();

    if (defaults.checklist.length > 0) {
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            defaultChecklistItems: defaults.checklist.map((c) => ({
              title: c.title,
              rewardPoints: c.rewardPoints,
            })),
          },
        },
      );
    }

    if (defaults.habits.length > 0) {
      await Habit.insertMany(
        defaults.habits.map((h) => ({
          user: userId,
          name: h.name,
          description: h.description,
          rewardPoints: h.rewardPoints,
          color: h.color,
          icon: h.icon,
        })),
      );
    }
    // Dhikr defaults are read on-demand via dhikrService.getDay(), so
    // there's nothing to copy at signup.
  } catch {
    // Seeding is best-effort — never block account creation on it.
  }
}

export const authService = {
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await User.findOne({ email: dto.email }).lean();
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_SALT_ROUNDS);
    const user = await User.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      locale: dto.locale ?? 'en',
      timezone: dto.timezone ?? 'UTC',
    });

    await seedNewUserContent(user._id);

    return buildAuthResult(user);
  },

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await User.findOne({ email: dto.email }).select('+passwordHash');
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }
    if (user.suspended) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
    }

    const ok = await user.comparePassword(dto.password);
    if (!ok) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    return buildAuthResult(user);
  },

  /**
   * Sign in (or sign up, if no account yet) with a Google ID token. We verify
   * the token's signature server-side and either link to an existing email or
   * create a new password-less account.
   */
  async googleAuth(dto: GoogleAuthDto): Promise<AuthResult> {
    if (!googleClient) {
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'Google sign-in is not configured on this server',
      );
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Google token');
    }
    if (!payload?.sub || !payload.email) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Google did not return a usable identity');
    }
    if (!payload.email_verified) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Google email is not verified');
    }

    const email = payload.email.toLowerCase();

    // Match by googleId first, then fall back to email (link existing account).
    let user = await User.findOne({ googleId: payload.sub });
    let isNew = false;
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = payload.sub;
        if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
        await user.save();
      } else {
        user = await User.create({
          email,
          name: payload.name || email.split('@')[0],
          googleId: payload.sub,
          avatarUrl: payload.picture,
          locale: dto.locale ?? 'en',
          timezone: dto.timezone ?? 'UTC',
        });
        isNew = true;
      }
    }

    if (user.suspended) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
    }

    if (isNew) await seedNewUserContent(user._id);

    return buildAuthResult(user);
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token type');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User no longer exists');
    }
    if (user.suspended) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
    }

    return buildAuthResult(user);
  },

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user.toSafeJSON();
  },
};

// Re-export for downstream consumers that might want the role helper inline.
export type { UserRole };
