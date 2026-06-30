import cron, { type ScheduledTask } from 'node-cron';

import { salahService } from '@/modules/salah/salah.service';
import { logger } from '@/utils/logger';

/**
 * Salah auto-miss sweep.
 *
 * Runs hourly (a single daily UTC run would lag a user's local midnight by up
 * to ~24h depending on their offset). Each run settles every day that has
 * already ended in the user's own timezone, flipping untouched (`pending`)
 * prayers to `missed`. The work is idempotent and only touches days that
 * still hold a pending Fard, so re-running every hour is cheap.
 *
 * `noOverlap` guards against a slow sweep overlapping with the next tick.
 */
const SALAH_MISS_CRON = '5 * * * *';

let tasks: ScheduledTask[] = [];

export function startScheduledJobs(): void {
  const salahMissTask = cron.schedule(
    SALAH_MISS_CRON,
    async () => {
      try {
        await salahService.settleAllEndedDays();
      } catch (err) {
        logger.error('Salah auto-miss sweep failed', err as Error);
      }
    },
    { name: 'salah-auto-miss', timezone: 'UTC', noOverlap: true },
  );

  tasks = [salahMissTask];
  logger.info('⏰ Scheduled jobs started (salah auto-miss: hourly)');
}

export async function stopScheduledJobs(): Promise<void> {
  await Promise.all(tasks.map((task) => task.stop()));
  tasks = [];
}
