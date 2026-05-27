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

export const googleAuthSchema = z.object({
  body: z.object({
    /** ID token from Google Identity Services on the client. */
    idToken: z.string().min(1, 'idToken is required'),
    locale: z.enum(['en', 'bn', 'ar']).optional(),
    timezone: z.string().optional(),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];
export type LoginDto = z.infer<typeof loginSchema>['body'];
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>['body'];
