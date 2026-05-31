import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';

import { env } from './env.js';
import { authService } from '../modules/auth/auth.service.js';
import { logger } from '../utils/logger.js';

/**
 * Centralised Passport setup for Ibadah.
 *
 * We deliberately use Passport in a *stateless* mode — every protected
 * API route still uses our own JWT bearer auth (`requireAuth`). Passport
 * is only here to handle the OAuth 2.0 dance with Google, which it does
 * better than a hand-rolled `google-auth-library` integration:
 *
 *   • State CSRF protection is layered with our own JWT state (see
 *     `oauthState.ts`) — Passport handles the redirect lifecycle,
 *     we handle the cryptographic verification ourselves so we don't
 *     need `express-session`.
 *   • The verify callback resolves a Mongo `User`, applying the same
 *     "match by googleId, then email, then create" logic the previous
 *     ID-token flow used. The user document (not its primary key) is
 *     handed to the route via `req.user`.
 *   • `serializeUser` / `deserializeUser` are intentionally absent —
 *     we never call `req.login()`, so they would never run anyway.
 */

let configured = false;

export function configurePassport(): typeof passport {
  if (configured) return passport;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = env;

  // Soft-disable: when credentials aren't set we still mount the routes
  // but they reply with a clean 503. Lets unconfigured deployments boot.
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.warn(
      '[passport] Google OAuth disabled: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET are not set',
    );
    configured = true;
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        // We sign and verify our own state JWT, so don't ask Passport to
        // also juggle a session-bound state nonce.
        state: false,
        // Forwards the proxied protocol/host when behind a reverse
        // proxy (Vercel, fly.io, ALB, etc.) — pairs with `app.set('trust proxy', 1)`.
        proxy: true,
        // Pass the request into the verify callback so we can read the
        // verified state JWT for locale/timezone seed values.
        passReqToCallback: true,
      },
      async (
        req,
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          // The route handler injects the verified state payload on the
          // request before calling passport.authenticate. We surface its
          // locale/timezone hints so a brand-new account starts with the
          // visitor's chosen locale instead of the API default.
          const reqWithState = req as typeof req & {
            oauthState?: { locale?: 'en' | 'bn' | 'ar'; timezone?: string };
          };

          const user = await authService.linkOrCreateGoogleUser(profile, {
            locale: reqWithState.oauthState?.locale,
            timezone: reqWithState.oauthState?.timezone,
          });
          // Pass the lean user representation, not the document — Passport
          // attaches whatever we hand to it onto `req.user`, and our route
          // code only needs the id + safe fields.
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );

  configured = true;
  return passport;
}

/** True when the Google strategy is registered and ready to authenticate. */
export function isGoogleAuthConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
