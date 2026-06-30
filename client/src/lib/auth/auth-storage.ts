/**
 * Web session marker.
 *
 * The real access/refresh tokens now live in **httpOnly cookies** set by
 * the server, so JavaScript can neither read nor store them (that's the
 * whole point — they're safe from XSS). The browser attaches them
 * automatically on every request via `credentials: 'include'`.
 *
 * What we DO keep in localStorage is a tiny, non-secret boolean hint that
 * says "this browser has logged in at least once". It lets the app skip
 * the `/auth/me` round-trip for anonymous visitors and avoid a flash of
 * logged-out UI. It carries no credentials, so it's fine in localStorage.
 *
 * The legacy `getAccess` / `getRefresh` / `set` methods are retained as
 * no-op shims so the many `*-api.ts` callers that still pass
 * `token: authStorage.getAccess()` keep compiling — they now resolve to
 * `null`, and the cookie carries auth instead.
 */
const SESSION_KEY = 'ibadah:session';

export const authStorage = {
  /** @deprecated Tokens are httpOnly cookies now; always returns null. */
  getAccess(): string | null {
    return null;
  },
  /** @deprecated Tokens are httpOnly cookies now; always returns null. */
  getRefresh(): string | null {
    return null;
  },
  /** Mark that this browser has an active (cookie-backed) session. */
  markSession() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SESSION_KEY, '1');
  },
  /** True if we believe a session exists (cookie may still have expired). */
  hasSession(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SESSION_KEY) === '1';
  },
  /**
   * Back-compat alias for old callers that did `authStorage.set(a, r)`.
   * We ignore the tokens (cookies hold them) and just flag the session.
   */
  set(_access?: string, _refresh?: string) {
    this.markSession();
  },
  /** Forget the session marker (called on logout / hard auth failure). */
  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(SESSION_KEY);
  },
};
