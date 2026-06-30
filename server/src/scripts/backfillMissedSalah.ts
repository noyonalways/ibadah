/**
 * One-shot / idempotent backfill for the salah auto-miss requirement.
 *
 * Sweeps every user and flips any untouched (`pending`) waqt Fard on a day
 * that has already ended (in the user's own timezone) to `missed`, recomputing
 * the daily total. This is the same routine the hourly cron runs — exposed as
 * a script so existing historical data can be settled on demand (e.g. right
 * after deploying the feature).
 *
 * Run with:
 *
 *     pnpm backfill:missed-salah
 *
 * Safe to run repeatedly: only days that still hold a pending Fard are touched.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '@/config/db';
import { salahService } from '@/modules/salah/salah.service';

async function run(): Promise<void> {
  await connectDatabase();
  const updated = await salahService.settleAllEndedDays();
  // eslint-disable-next-line no-console
  console.log(`✅ Salah auto-miss backfill complete. Settled ${updated} day(s).`);
}

run()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Backfill failed:', err instanceof Error ? err.message : err);
    if (mongoose.connection.readyState !== 0) {
      await disconnectDatabase().catch(() => undefined);
    }
    process.exit(1);
  });
