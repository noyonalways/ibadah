## Why

The production server at `api.ibadah.noyonrahman.com` is under continuous automated scanning and probing. Server logs reveal:

- **WordPress vulnerability scanning** — repeated requests to `/wp-login.php`, `/wp-admin/`, `/wp-json/`, and variant prefixes (`/blog/`, `/wordpress/`, `/cms/`, `/site/`, etc.)
- **Sensitive file probing** — bots requesting `/.env`, `/.git/config`, `/.DS_Store`, `/.vscode/sftp.json`, `/config.json`
- **Infrastructure reconnaissance** — probes for `/server-status`, `/console/`, `/actuator/env`, `/graphql`, `/v2/_catalog` (Docker registry), `/@vite/env`
- **CMS/framework fingerprinting** — requests for `/xmlrpc.php`, `/telescope/requests` (Laravel), `/login.action` (Confluence/Jira), `/info.php`

While these scans currently return 404s (the server isn't running WordPress), they waste resources, inflate logs, and represent attackers actively searching for exploitable entry points. The existing global rate limiter (300 req / 15 min) is too generous for this type of traffic. A targeted defense-in-depth approach is needed.

## What Changes

- **Bot/scanner request blocker** — new middleware that immediately rejects requests to well-known exploit paths (`.env`, `.git/config`, `wp-login.php`, etc.) with a 403 and logs the attempt, rather than wasting cycles routing them to the 404 handler.
- **Stricter rate limiting for auth endpoints** — tighten the existing `authLimiter` on login/register (currently 20 req / 15 min per IP), and add an aggressive limiter specifically for failed login attempts to slow down credential stuffing.
- **Suspicious 404 rate limiter** — auto-ban IPs that generate excessive 404s in a short window (scanner hallmark: rapid-fire requests to nonexistent paths).
- **Security logging** — structured winston logs for blocked requests and rate-limit triggers so the admin can monitor and audit threats.
- **Security response headers hardening** — review and tighten helmet configuration to eliminate information leakage (remove `X-Powered-By` leak, add stricter CSP, etc.).

## Capabilities

### New Capabilities
- `request-shield`: Bot/scanner blocking middleware that drops requests to known exploit paths, enforces progressive rate limiting for scanners, and logs security events.

### Modified Capabilities
_None — no existing spec-level requirements are changing. The current auth rate limiter's window/max values are implementation details, not spec-level behavior._

## Impact

- **Server middleware stack** — new `requestShield` middleware added early in the Express pipeline (before routing), plus a scanner-detection rate limiter.
- **Auth routes** — tighter rate-limit values for login/register endpoints; new failed-login tracking.
- **Logging** — new structured security log entries via the existing winston logger.
- **Dependencies** — no new npm packages required; `express-rate-limit` and `helmet` are already installed.
- **Performance** — negligible; blocked requests are rejected immediately (no DB hit, no routing).
- **Breaking changes** — none for legitimate API consumers; only malicious/scanner traffic is affected.
