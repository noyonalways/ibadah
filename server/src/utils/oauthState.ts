import { randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

/**
 * Stateless OAuth `state` parameter.
 *
 * Why JWT instead of `passport.authenticate(..., { state: true })`?
 *   The built-in helper requires `req.session`, which would force us to
 *   add `express-session` for a flow that finishes in two HTTP hops. By
 *   signing a short-lived JWT we keep the API stateless while still
 *   getting:
 *     • CSRF protection — any tampered or reused state is rejected.
 *     • Carrying intent  — locale, timezone, and a sanitized returnTo
 *       survive the round-trip without leaking through the client.
 *
 * Domain-separated from the rest of the JWTs by the `aud: 'oauth-state'`
 * claim, so an access token can never be reused as state and vice versa.
 */

const AUDIENCE = 'oauth-state';
const STATE_TTL = '5m';

export interface OAuthStatePayload {
  /** App locale to fall back to when creating a brand-new account. */
  locale?: 'en' | 'bn' | 'ar';
  /** IANA tz name to fall back to when creating a brand-new account. */
  timezone?: string;
  /**
   * Sanitized in-app path to land on after the SPA exchanges the code.
   * Always begins with `/` and never includes a host — see `sanitizeReturnTo`.
   */
  returnTo?: string;
  /** Random nonce so two simultaneous logins from the same IP differ. */
  nonce: string;
}

export function signOAuthState(payload: Omit<OAuthStatePayload, 'nonce'>): string {
  const opts: SignOptions = {
    expiresIn: STATE_TTL,
    audience: AUDIENCE,
  };
  return jwt.sign(
    { ...payload, nonce: randomBytes(12).toString('hex') },
    env.JWT_ACCESS_SECRET,
    opts,
  );
}

export function verifyOAuthState(state: string): OAuthStatePayload {
  // jwt.verify will throw on expired / wrong-audience / invalid-signature.
  const decoded = jwt.verify(state, env.JWT_ACCESS_SECRET, {
    audience: AUDIENCE,
  }) as OAuthStatePayload & { iat: number; exp: number; aud: string };
  return {
    locale: decoded.locale,
    timezone: decoded.timezone,
    returnTo: decoded.returnTo,
    nonce: decoded.nonce,
  };
}

/**
 * Reduce an arbitrary user-supplied `returnTo` to a safe in-app path.
 * Anything host-bearing or protocol-relative is dropped so the OAuth
 * callback can't be weaponised as an open redirector.
 */
export function sanitizeReturnTo(input: unknown): string | undefined {
  if (typeof input !== 'string' || input.length === 0) return undefined;
  // Reject absolute URLs, scheme-less protocol-relative URLs, and paths
  // with embedded line breaks (header injection).
  if (/^[a-z][a-z0-9+.-]*:/i.test(input)) return undefined;
  if (input.startsWith('//')) return undefined;
  if (/[\r\n]/.test(input)) return undefined;
  if (!input.startsWith('/')) return undefined;
  // Cap length defensively — the client only ever sends short paths.
  return input.length > 256 ? undefined : input;
}
