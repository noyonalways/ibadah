## 1. Request Shield Middleware

- [x] 1.1 Create `server/src/middleware/requestShield.ts` to detect and block scanner/exploit paths (`.env`, `.git`, `wp-*`, `.php`, admin probes) with 403 Forbidden and log warning details.
- [x] 1.2 Mount `requestShield` in `server/src/app.ts` near top of Express middleware pipeline.

## 2. Rate Limiting & 404 Hardening

- [x] 2.1 Update `authLimiter` in `server/src/modules/auth/auth.routes.ts` to enforce stricter thresholds for password endpoints.
- [x] 2.2 Add 404 rate-limiter in `server/src/middleware/notFound.ts` to throttle rapid probing of non-existent endpoints.

## 3. Express Security & Verification

- [x] 3.1 Harden `app.ts` security settings (`app.disable('x-powered-by')`, verify helmet options).
- [x] 3.2 Verify server builds cleanly with `pnpm build` and passes typechecking.
