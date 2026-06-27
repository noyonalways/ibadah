import 'dotenv/config';
import { z } from 'zod';

/**
 * Validate environment variables at startup so we fail fast with a clear
 * message instead of getting cryptic runtime errors deep in the app.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  SERVER_URL: z.string().url().default('http://localhost:5000'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  /** Google OAuth — required only if you want sign-in with Google. */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /**
   * Absolute URL Google Identity will redirect back to after consent.
   * Must match exactly one of the "Authorized redirect URIs" registered
   * on the OAuth client in the Google Cloud Console.
   *
   * Defaults to `${API origin}/api/v1/auth/google/callback` derived from
   * the deployment, but can be overridden when the API sits behind a
   * proxy with a different public URL.
   */
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:5000/api/v1/auth/google/callback'),
  /**
   * Path on the **client** that handles the post-consent redirect from
   * the API and exchanges the one-time code for JWTs. Path-only — the
   * locale prefix and origin are added at runtime.
   */
  CLIENT_OAUTH_CALLBACK_PATH: z.string().default('/auth/callback'),

  /** CORS — comma-separated list of allowed origin URLs. */
  CORS_SUPPORT_URL: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((url) => url.trim())),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
