import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.js';
import { User } from '../user/user.model.js';
import type { SafeUser } from '../user/user.interface.js';
import type { LoginDto, RegisterDto } from './auth.validation.js';

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

async function buildAuthResult(userId: string, email: string, user: SafeUser): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = signRefreshToken({ sub: userId, email });
  return { user, accessToken, refreshToken };
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

    return buildAuthResult(user.id, user.email, user.toSafeJSON());
  },

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await User.findOne({ email: dto.email }).select('+passwordHash');
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    const ok = await user.comparePassword(dto.password);
    if (!ok) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    return buildAuthResult(user.id, user.email, user.toSafeJSON());
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

    return buildAuthResult(user.id, user.email, user.toSafeJSON());
  },

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user.toSafeJSON();
  },
};
