## Context

The server log analysis confirms ongoing automated scanning from unknown botnet IPs trying common paths for WordPress, Laravel, PHP, Atlassian, Exchange, Git, and environment credentials.
Currently, `app.ts` uses Express 5, `helmet`, `cors`, and `express-rate-limit` (global limit 300 req / 15 mins per IP, auth limit 20 req / 15 mins per IP). However, unmapped probe endpoints pass through all middleware and reach `notFound.ts` (returning HTTP 404).

We need a dedicated defense-in-depth shield that blocks scanner paths at the middleware layer before routing, enforces stricter limits on sensitive endpoints, and tracks bad actor activity without degrading legitimate application performance.

## Goals / Non-Goals

**Goals:**
- Block known web scanner / probe signatures immediately with HTTP 403.
- Rate-limit login and credential endpoints more tightly to resist password brute-forcing and credential stuffing.
- Implement scanner detection that throttles or blocks IPs generating high volumes of 404 responses.
- Log security events with IP, User-Agent, and target path for admin visibility.
- Harden Express response headers (e.g. remove `X-Powered-By`, enhance helmet headers).

**Non-Goals:**
- Building a full Web Application Firewall (WAF) or cloud-level DDoS mitigation (that belongs at Cloudflare/reverse proxy layer).
- Persistent database storage of blocked IPs across process restarts (in-memory rate limiting with `express-rate-limit` is sufficient for application-level defence).

## Decisions

### 1. Request Shield Middleware (`src/middleware/requestShield.ts`)
- Positioned high in the Express middleware chain in `app.ts` (immediately after `helmet()` and CORS).
- Regex and prefix matching against common probe patterns:
  - Sensitive files: `/\.(env|git|vscode|DS_Store|idea|aws|ssh)/i`, `/config\.json`
  - CMS/PHP patterns: `/\/wp-(login|admin|json|includes|content)/i`, `/\.php$/i`, `/xmlrpc\.php`
  - Admin/Dev consoles: `/\/actuator/i`, `/telescope`, `/\/console\//i`, `/server-status`
- If matched, log a warning with Winston logger (`logger.warn`) and immediately return HTTP 403 Forbidden without invoking `next()`.

### 2. Tightened Authentication Rate Limiting
- Keep `authLimiter` for general auth endpoints (register, login, oauth exchange) set to a stricter threshold:
  - 10 requests per 15-minute window for password auth (`/login`, `/register`).
- Add custom skipped/failed attempt logging for login attempts to identify repeated credential brute-forcing.

### 3. Suspicious 404 Rate Limiting (`notFound.ts` integration)
- Use a dedicated `express-rate-limit` instance for 404 responses or attach a memory-store counter in `notFound` handler.
- If an IP accumulates > 30 404s in 15 minutes, subsequent unmatched requests receive HTTP 429 Too Many Requests.

### 4. Express Security Configuration
- Explicitly disable `x-powered-by` via `app.disable('x-powered-by')`.
- Ensure `trust proxy` setting is configured properly (`app.set('trust proxy', 1)`) so IP detection works accurately behind reverse proxies (Nginx / Nixpacks / Cloudflare).

## Risks / Trade-offs

- **[Risk] False Positive Blocking** → *Mitigation*: Ensure regex patterns only match non-existent API routes (e.g., `.php`, `wp-*`, `.env`, `.git`) that legitimate API clients (web frontend/mobile) will never call.
- **[Risk] Reverse Proxy IP Spoofing** → *Mitigation*: Rely on Express `trust proxy` setting so standard headers like `X-Forwarded-For` are safely processed by `express-rate-limit`.

## Migration Plan

1. Create `src/middleware/requestShield.ts` and unit/integration tests if applicable.
2. Mount `requestShield` in `src/app.ts`.
3. Update `src/modules/auth/auth.routes.ts` with updated rate limit settings.
4. Add rate limiting / tracking in `src/middleware/notFound.ts`.
5. Deploy to production environment. No database schema updates required.
