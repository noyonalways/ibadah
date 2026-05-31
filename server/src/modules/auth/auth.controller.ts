import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { configurePassport, isGoogleAuthConfigured } from '../../config/passport.js';
import {
  sanitizeReturnTo,
  signOAuthState,
  verifyOAuthState,
  type OAuthStatePayload,
} from '../../utils/oauthState.js';
import { logger } from '../../utils/logger.js';
import { authService } from './auth.service.js';
import type { GoogleInitQuery } from './auth.validation.js';
import type { SafeUser } from '../user/user.interface.js';

const passport = configurePassport();

/**
 * Build the URL we redirect the SPA to once the OAuth dance is over.
 * Mirrors the locale-prefixed routing of the Next.js client so deep-
 * links land in the user's preferred language.
 */
function buildClientRedirect(
  base: string,
  locale: 'en' | 'bn' | 'ar' | undefined,
  qs: Record<string, string>,
): string {
  const url = new URL(base);
  // Preserve any existing path segments (e.g. CLIENT_URL points at a sub-path).
  const localePrefix = locale ? `/${locale}` : '';
  const trailing = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  url.pathname = `${trailing}${localePrefix}${env.CLIENT_OAUTH_CALLBACK_PATH}`;
  url.search = new URLSearchParams(qs).toString();
  return url.toString();
}

function clientErrorRedirect(
  locale: 'en' | 'bn' | 'ar' | undefined,
  reason: string,
  message?: string,
): string {
  return buildClientRedirect(env.CLIENT_URL, locale, {
    error: reason,
    ...(message ? { message } : {}),
  });
}

export const authController = {
  register: catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: 'Account created successfully',
      data: result,
    });
  }),

  login: catchAsync(async (req, res) => {
    const result = await authService.login(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Logged in successfully',
      data: result,
    });
  }),

  /**
   * Step 1 of the OAuth flow.
   * Sign a short-lived state JWT carrying the visitor's locale,
   * timezone, and (sanitised) returnTo, then hand control to Passport
   * which 302s the user over to Google.
   */
  startGoogle: (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleAuthConfigured()) {
      return next(
        new ApiError(
          StatusCodes.SERVICE_UNAVAILABLE,
          'Google sign-in is not configured on this server',
        ),
      );
    }

    const query = req.query as GoogleInitQuery;
    const state = signOAuthState({
      locale: query.locale,
      timezone: query.timezone,
      returnTo: sanitizeReturnTo(query.returnTo),
    });

    return passport.authenticate('google', {
      session: false,
      scope: ['profile', 'email'],
      state,
      // `select_account` lets users pick a different Google account on
      // every sign-in attempt, which is friendlier than silently
      // re-using the most-recent one.
      prompt: 'select_account',
    })(req, res, next);
  },

  /**
   * Step 2 of the OAuth flow.
   * Verify our own state JWT *before* delegating to Passport, mint a
   * one-time code, then redirect the SPA to its callback page.
   */
  googleCallback: (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleAuthConfigured()) {
      return next(
        new ApiError(
          StatusCodes.SERVICE_UNAVAILABLE,
          'Google sign-in is not configured on this server',
        ),
      );
    }

    // Surface explicit denial / Google-side errors as a localised
    // redirect rather than a server 500. `error=access_denied` is the
    // common case where the user clicks "Cancel" on the consent screen.
    const googleError = req.query.error;
    const rawState = req.query.state;
    let statePayload: OAuthStatePayload | null = null;

    if (typeof rawState === 'string' && rawState.length > 0) {
      try {
        statePayload = verifyOAuthState(rawState);
      } catch {
        statePayload = null;
      }
    }

    if (typeof googleError === 'string' && googleError.length > 0) {
      const target = clientErrorRedirect(statePayload?.locale, googleError);
      return res.redirect(target);
    }

    if (!statePayload) {
      const target = clientErrorRedirect(undefined, 'invalid_state');
      return res.redirect(target);
    }

    // Surface the verified state to the strategy's verify callback
    // without polluting Express types globally.
    (req as Request & { oauthState?: OAuthStatePayload }).oauthState = statePayload;

    return passport.authenticate(
      'google',
      { session: false, failWithError: true },
      (err: Error | null, user: SafeUser | false | null) => {
        if (err || !user) {
          // ApiError thrown from the verify callback (e.g. suspended
          // account, missing email) is operational — keep the message.
          const reason =
            err instanceof ApiError
              ? 'auth_failed'
              : err
                ? 'auth_failed'
                : 'no_account';
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : undefined;

          if (err && !(err instanceof ApiError)) {
            logger.warn(
              `[oauth] google callback failed: ${err.message ?? 'unknown'}`,
            );
          }

          const target = clientErrorRedirect(statePayload!.locale, reason, message);
          return res.redirect(target);
        }

        // Mint the single-use code and redirect to the SPA's callback.
        const code = authService.issueOAuthCode(user.id);
        const target = buildClientRedirect(env.CLIENT_URL, statePayload!.locale, {
          code,
          ...(statePayload!.returnTo ? { returnTo: statePayload!.returnTo } : {}),
        });
        return res.redirect(target);
      },
    )(req, res, next);
  },

  /**
   * Step 3 of the OAuth flow.
   * Exchange the one-time code for the real `{ user, accessToken, refreshToken }`.
   * Same response shape as `/auth/login` so the client storage layer
   * doesn't have to special-case the OAuth path.
   */
  googleExchange: catchAsync(async (req, res) => {
    const { code } = req.body as { code: string };
    const result = await authService.exchangeOAuthCode(code);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Logged in with Google',
      data: result,
    });
  }),

  refresh: catchAsync(async (req, res) => {
    const token =
      (req.body?.refreshToken as string | undefined) ??
      (req.cookies?.refreshToken as string | undefined);
    if (!token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
    }
    const result = await authService.refresh(token);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Token refreshed',
      data: result,
    });
  }),

  me: catchAsync(async (req, res) => {
    if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
    const user = await authService.getCurrentUser(req.user.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Current user',
      data: { user },
    });
  }),
};
