import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

import { Release } from '@/modules/release/release.model';
import { logger } from '@/utils/logger';

interface ChangelogEntry {
  category: 'feature' | 'fix' | 'enhancement';
  title: string;
  scope?: string;
}

interface ChangelogRelease {
  version: string;
  date: string;
  entries: ChangelogEntry[];
}

export const releaseService = {
  /**
   * Paginated query for releases, sorted by date descending (newest first).
   */
  async getReleases(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Release.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Release.countDocuments(),
    ]);
    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Seed releases from the generated changelog.json into MongoDB.
   * Idempotent — upserts by version, so re-running is safe.
   */
  async seedReleases(): Promise<void> {
    // Try multiple paths for the changelog file
    const candidates = [
      resolve(process.cwd(), 'dist', 'changelog.json'),
      resolve(process.cwd(), 'changelog.json'),
    ];

    let changelogPath: string | null = null;
    for (const p of candidates) {
      if (existsSync(p)) {
        changelogPath = p;
        break;
      }
    }

    if (!changelogPath) {
      logger.warn('[releases] No changelog.json found — skipping seed');
      return;
    }

    let releases: ChangelogRelease[];
    try {
      const raw = readFileSync(changelogPath, 'utf-8');
      releases = JSON.parse(raw) as ChangelogRelease[];
    } catch (err) {
      logger.warn('[releases] Failed to parse changelog.json — skipping seed', err);
      return;
    }

    if (releases.length === 0) {
      logger.info('[releases] Changelog is empty — nothing to seed');
      return;
    }

    // Get existing versions to avoid unnecessary writes
    const existingVersions = new Set(
      (await Release.find({}, { version: 1 }).lean()).map((r) => r.version),
    );

    let inserted = 0;
    for (const release of releases) {
      if (existingVersions.has(release.version)) continue;

      await Release.create({
        version: release.version,
        date: new Date(release.date),
        entries: release.entries,
      });
      inserted++;
    }

    if (inserted > 0) {
      logger.info(`[releases] Seeded ${inserted} new release(s)`);
    } else {
      logger.info('[releases] All releases up-to-date — nothing to seed');
    }
  },
};
