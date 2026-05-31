import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';
import {
  googleExchangeSchema,
  googleInitSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.validation.js';

/**
 * The classic password endpoints are rate-limited per IP. The OAuth
 * redirect endpoints get their own (looser) limiter — Google may
 * legitimately bounce a user back to the callback multiple times in a
 * row in some flows (consent re-prompt, account chooser, etc.).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Please try again later.' },
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);

/* --------------------------- Google OAuth --------------------------- */

/**
 * GET /auth/google
 * Public entry point — redirects the browser to Google with our signed
 * state parameter. The SPA links to this URL directly; no JSON request
 * body is involved.
 */
authRouter.get(
  '/google',
  oauthLimiter,
  validate(googleInitSchema),
  authController.startGoogle,
);

/**
 * GET /auth/google/callback
 * Google redirects here after the user grants (or denies) consent. We
 * verify the state JWT, run Passport's verify callback, mint a one-
 * time auth code, and redirect to the SPA's callback page.
 */
authRouter.get('/google/callback', oauthLimiter, authController.googleCallback);

/**
 * POST /auth/google/exchange
 * The SPA's callback page POSTs the one-time code here to receive the
 * real JWT pair. Single-use, ~60s TTL.
 */
authRouter.post(
  '/google/exchange',
  authLimiter,
  validate(googleExchangeSchema),
  authController.googleExchange,
);

/* ----------------------------- Tokens ------------------------------- */

authRouter.post('/refresh', validate(refreshSchema), authController.refresh);
authRouter.get('/me', requireAuth, authController.me);
