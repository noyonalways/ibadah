import type { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '@/config/env';

/**
 * Cookie-based delivery of the JWT pair for the web (browser) auth flow.
 *
 * Why cookies for web and not for mobile?
 *   - Browsers: httpOnly cookies can't be read by JavaScript, so they're
 *     immune to token theft via XSS. The browser also attaches them
 *     automatically (with `credentials: 'include'`), so the SPA never has
 *     to touch the raw tokens.
 *   - Mobile (native apps): there's no cookie jar / same-origin model to
 *     lean on, so those clients receive the tokens in the JSON body and
 *     store them in secure device storage, sending them back as
 *     `Authorization: Bearer <accessToken>`.
 *
 * The server decides which mode to use per-request via the
 * `x-client-type` header — see `isWebClient`.
 */

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

/**
 * True when the caller identifies itself as a browser (`x-client-type:
 * web`). Anything else — native mobile apps, server-to-server callers,
 * the admin panel, or a missing header — is treated as a Bearer/body
 * client. Defaulting to body mode keeps every existing consumer working.
 */
export function isWebClient(req: Request): boolean {
  return String(req.headers['x-client-type'] ?? '').toLowerCase() === 'web';
}

/**
 * Read the access token a browser sent us as a cookie (the Bearer header
 * is checked separately by `requireAuth`).
 */
export function readAccessCookie(req: Request): string | undefined {
  const raw = (req.cookies as Record<string, unknown> | undefined)?.[ACCESS_COOKIE];
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

/** Read the refresh token cookie (web refresh flow). */
export function readRefreshCookie(req: Request): string | undefined {
  const raw = (req.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

/**
 * Build the shared cookie options. `SameSite=None` is only valid over a
 * Secure connection, so we force `secure` on in that case regardless of
 * the configured/derived value.
 */
function baseOptions(): CookieOptions {
  const sameSite = env.COOKIE_SAME_SITE;
  const secure = sameSite === 'none' ? true : (env.COOKIE_SECURE ?? env.NODE_ENV === 'production');
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

/**
 * Derive the cookie lifetime from the token's own `exp` claim so the
 * cookie and the JWT expire together. Falls back to a sane default if the
 * token can't be decoded.
 */
function maxAgeFromToken(token: string, fallbackMs: number): number {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === 'object' && typeof decoded.exp === 'number') {
    const ms = decoded.exp * 1000 - Date.now();
    if (ms > 0) return ms;
  }
  return fallbackMs;
}

const ONE_HOUR = 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * ONE_HOUR;

/** Set both auth cookies on the response (web flow). */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const base = baseOptions();
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: maxAgeFromToken(accessToken, ONE_HOUR),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: maxAgeFromToken(refreshToken, THIRTY_DAYS),
  });
}

/**
 * Clear both auth cookies. The clearing cookie must carry the same
 * `path`/`domain`/`sameSite`/`secure` attributes as the one we set, or
 * the browser won't match and remove it.
 */
export function clearAuthCookies(res: Response): void {
  const base = baseOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
