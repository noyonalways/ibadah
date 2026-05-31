import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: z.string().trim().toLowerCase().email(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
    locale: z.enum(['en', 'bn', 'ar']).optional(),
    timezone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
});

/**
 * Query string accepted by `GET /auth/google`. Everything is optional —
 * we sign whatever we get into the OAuth state JWT and recover it on
 * the callback to seed new accounts and choose the post-login landing
 * locale.
 */
export const googleInitSchema = z.object({
  query: z.object({
    locale: z.enum(['en', 'bn', 'ar']).optional(),
    timezone: z.string().trim().max(64).optional(),
    /**
     * In-app path to land on after exchange. The value is sanitized
     * later (see `sanitizeReturnTo`); we only enforce a basic shape
     * here so absurdly long values can never reach the JWT.
     */
    returnTo: z.string().trim().max(256).optional(),
  }),
});

/**
 * Body accepted by `POST /auth/google/exchange`. The code is the opaque
 * single-use string the API redirects the SPA with after a successful
 * Google sign-in.
 */
export const googleExchangeSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(20, 'Sign-in code is missing or too short')
      .max(256, 'Sign-in code is malformed'),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];
export type LoginDto = z.infer<typeof loginSchema>['body'];
export type GoogleInitQuery = z.infer<typeof googleInitSchema>['query'];
export type GoogleExchangeDto = z.infer<typeof googleExchangeSchema>['body'];
