/**
 * Local-only token storage. Same keys as the user app (`ibadah:access`,
 * `ibadah:refresh`) so a developer who is already signed in via the client
 * can hop into the admin panel without re-authenticating during development.
 *
 * For production hardening, swap to httpOnly cookies set by the server.
 */
const ACCESS_KEY = 'ibadah:access';
const REFRESH_KEY = 'ibadah:refresh';

export const authStorage = {
  getAccess(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
