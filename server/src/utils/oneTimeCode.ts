import { randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Single-use, short-lived auth code store.
 *
 * After a successful Google sign-in we don't want to put the long-lived
 * JWT pair in the redirect URL — they would end up in the browser
 * history, the referrer header of the next click, and any access logs
 * along the way. Instead, the API hands the SPA a short opaque code
 * that the SPA POSTs back to the dedicated `/auth/google/exchange`
 * endpoint to receive the real tokens.
 *
 * Properties:
 *   • Codes are 32 bytes of CSPRNG entropy, base64url-encoded — far
 *     beyond what an attacker can brute force in 60 seconds.
 *   • Each code is consumed at most once. Even if intercepted by a
 *     malicious extension, racing the SPA wins or loses but never both.
 *   • Codes auto-expire after the TTL even if never consumed, so a
 *     malicious app that opens the OAuth flow without finishing it
 *     can't accumulate stale entries.
 *
 * The store is in-memory and therefore single-process. For a multi-
 * instance deployment, swap the `Map` for a Redis-backed equivalent
 * (the public surface here is small — only `issue`, `consume`, and
 * `cleanupNow`). The single-process simplification is acceptable here
 * because the code is only valid for ~60s and the SPA exchanges it
 * immediately on the same backend that issued it (sticky-session
 * deployments work fine).
 */

const TTL_MS = 60_000;

interface CodeEntry {
  userId: string;
  /** Unix ms after which the entry must be discarded. */
  expiresAt: number;
}

const store = new Map<string, CodeEntry>();

/** Sweep on every operation — bounded work because TTL_MS is tiny. */
function sweep(now = Date.now()): void {
  for (const [code, entry] of store) {
    if (entry.expiresAt <= now) store.delete(code);
  }
}

export const oneTimeCodeStore = {
  /**
   * Mint a new code for the given user. The plaintext is the only copy
   * of the code that ever leaves this function — the SPA must round-
   * trip it immediately to redeem.
   */
  issue(userId: string): string {
    sweep();
    // 32 bytes ≈ 256 bits, base64url ⇒ 43 chars, no padding, URL-safe.
    const code = randomBytes(32).toString('base64url');
    store.set(code, { userId, expiresAt: Date.now() + TTL_MS });
    return code;
  },

  /**
   * Atomically read-and-delete a code. Returns the userId if the code
   * is valid and unused, or `null` for any failure. Uses a timing-safe
   * comparison while looking up the key to avoid disclosing whether a
   * given prefix is in the store.
   */
  consume(code: string): string | null {
    if (!code || code.length < 16 || code.length > 256) return null;
    sweep();

    // Timing-safe key search — Map.get is O(1) but we do still walk the
    // possibly-tiny set of equal-length entries to minimize signal.
    let match: { code: string; entry: CodeEntry } | null = null;
    const needle = Buffer.from(code);
    for (const [stored, entry] of store) {
      if (stored.length !== needle.length) continue;
      const haystack = Buffer.from(stored);
      if (timingSafeEqual(needle, haystack)) {
        match = { code: stored, entry };
        // No early break: keep iteration time independent of position.
      }
    }
    if (!match) return null;

    store.delete(match.code);
    if (match.entry.expiresAt <= Date.now()) return null;
    return match.entry.userId;
  },

  /** Test-only / ops-only helper. Exposed for completeness. */
  cleanupNow(): void {
    sweep();
  },

  /** Test-only / ops-only helper. */
  size(): number {
    sweep();
    return store.size;
  },
};
