import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { notFound } from './middleware/notFound.js';
import { apiRouter } from './routes/index.js';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // --- Security & infra middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Global rate limiter (per IP). Tweak per-route as needed.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  // --- Health check ---
  app.get('/health', (_req, res) => {
    res.status(StatusCodes.OK).json({ status: 'ok', uptime: process.uptime() });
  });

  // --- API routes ---
  app.use(env.API_PREFIX, apiRouter);

  // --- 404 + error handler (must be last) ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
