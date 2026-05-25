import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
    });
    logger.info('🗄️  MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed', err);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error', err);
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
