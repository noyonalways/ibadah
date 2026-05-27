import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';
import {
  googleAuthSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.validation.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/google', authLimiter, validate(googleAuthSchema), authController.googleAuth);
authRouter.post('/refresh', validate(refreshSchema), authController.refresh);
authRouter.get('/me', requireAuth, authController.me);
