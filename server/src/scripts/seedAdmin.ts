/**
 * Idempotent admin bootstrap script.
 *
 * Reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and (optional) `ADMIN_NAME` from
 * the environment, then either:
 *   - creates a brand-new admin account, or
 *   - promotes the existing account with that email to `role: 'admin'`
 *     and optionally rotates its password.
 *
 * Run with:
 *
 *     pnpm seed:admin
 *
 * Safe to run repeatedly. Never commits real credentials — the password
 * is only consumed in-memory and never logged.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/db';
import { User } from '@/modules/user/user.model';

interface SeedInput {
  email: string;
  password: string;
  name: string;
  rotatePassword: boolean;
}

function readSeedInput(): SeedInput {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = (process.env.ADMIN_NAME ?? '').trim() || 'Ibadah Admin';
  const rotatePassword = process.env.ADMIN_FORCE_PASSWORD_RESET === 'true';

  const errors: string[] = [];
  if (!email) errors.push('ADMIN_EMAIL is required');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('ADMIN_EMAIL is not a valid email');
  if (!password) errors.push('ADMIN_PASSWORD is required');
  if (password && password.length < 8) errors.push('ADMIN_PASSWORD must be at least 8 characters');

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid seed input:\n  - ' + errors.join('\n  - '));
    process.exit(1);
  }

  return { email, password, name, rotatePassword };
}

async function run(): Promise<void> {
  const input = readSeedInput();

  await connectDatabase();

  const existing = await User.findOne({ email: input.email }).select('+passwordHash');

  if (existing) {
    let changed = false;

    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
    }
    if (existing.suspended) {
      existing.suspended = false;
      changed = true;
    }
    if (input.rotatePassword || !existing.passwordHash) {
      existing.passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
      changed = true;
    }

    if (changed) {
      await existing.save();
      // eslint-disable-next-line no-console
      console.log(
        `✅ Promoted existing account to admin: ${existing.email}` +
          (input.rotatePassword ? ' (password rotated)' : ''),
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(`ℹ️  Account ${existing.email} is already an active admin. Nothing to do.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const created = await User.create({
      email: input.email,
      name: input.name,
      passwordHash,
      role: 'admin',
      suspended: false,
      locale: 'en',
      timezone: 'UTC',
    });
    // eslint-disable-next-line no-console
    console.log(`✅ Created admin account: ${created.email}`);
  }

  // eslint-disable-next-line no-console
  console.log('Done.');
}

run()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seed failed:', err instanceof Error ? err.message : err);
    if (mongoose.connection.readyState !== 0) await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
