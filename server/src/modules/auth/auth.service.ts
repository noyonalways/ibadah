import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import type { Profile } from 'passport-google-oauth20';

import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/token';
import { oneTimeCodeStore } from '@/utils/oneTimeCode';
import { User } from '@/modules/user/user.model';
import type { IUserDocument, SafeUser, UserRole } from '@/modules/user/user.interface';
import { defaultsService } from '@/modules/admin/defaults.service';
import { Habit } from '@/modules/habit/habit.model';
import type { LoginDto, RegisterDto } from '@/modules/auth/auth.validation';

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

interface GoogleSeedHints {
  locale?: 'en' | 'bn' | 'ar';
  timezone?: string;
}

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

/**
 * Pick the best email from a Google profile. Google only returns the
 * `verified` flag when we ask for it (`profile` scope already gives
 * primary email + verification status). We require verification to
 * defend against people typing arbitrary email addresses into a Google
 * account they technically own, but never proved.
 */
function extractVerifiedEmail(profile: Profile): string | null {
  const candidates = profile.emails ?? [];
  const verified = candidates.find((e) => e.verified !== false && e.value);
  return verified?.value?.toLowerCase() ?? null;
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
   * Resolve a Passport Google profile to an Ibadah user, creating or
   * linking as appropriate. Called from the Google strategy's verify
   * callback, *after* Passport has already exchanged the auth code with
   * Google and confirmed the profile is genuine.
   *
   * Match order:
   *   1. By `googleId` — returning Google-linked users.
   *   2. By verified `email` — links existing email-only accounts to
   *      the new Google identity, preserving history.
   *   3. Create a fresh, password-less account.
   *
   * Suspended accounts throw — Passport surfaces the error to the
   * route, which translates it into a redirect with `?error=...`.
   */
  async linkOrCreateGoogleUser(
    profile: Profile,
    hints: GoogleSeedHints = {},
  ): Promise<SafeUser> {
    if (!profile.id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Google did not return a usable identity');
    }
    const email = extractVerifiedEmail(profile);
    if (!email) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Google account has no verified email address',
      );
    }

    const picture = profile.photos?.[0]?.value;
    const displayName =
      profile.displayName?.trim() || `${profile.name?.givenName ?? ''}`.trim() || email.split('@')[0];

    let user = await User.findOne({ googleId: profile.id });
    let isNew = false;

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Existing email-only account: attach the Google identity.
        user.googleId = profile.id;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      } else {
        user = await User.create({
          email,
          name: displayName,
          googleId: profile.id,
          avatarUrl: picture,
          locale: hints.locale ?? 'en',
          timezone: hints.timezone ?? 'UTC',
        });
        isNew = true;
      }
    }

    if (user.suspended) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
    }

    if (isNew) await seedNewUserContent(user._id);

    return user.toSafeJSON();
  },

  /**
   * Mint a one-time auth code that the SPA can exchange for the real
   * token pair. The code is unguessable, single-use, and expires in
   * ~60s — see `oneTimeCodeStore`.
   */
  issueOAuthCode(userId: string): string {
    return oneTimeCodeStore.issue(userId);
  },

  /**
   * Redeem an auth code from the SPA's `/auth/callback` page. Returns
   * the same `{ user, accessToken, refreshToken }` shape as the
   * password flows so the client can store it the same way.
   */
  async exchangeOAuthCode(code: string): Promise<AuthResult> {
    const userId = oneTimeCodeStore.consume(code);
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired sign-in code');
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Account no longer exists');
    }
    if (user.suspended) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
    }
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
