import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

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

/** Conventional commit prefix → category mapping. */
const CATEGORY_MAP: Record<string, ChangelogEntry['category']> = {
  feat: 'feature',
  fix: 'fix',
  refactor: 'enhancement',
  perf: 'enhancement',
  style: 'enhancement',
  chore: 'enhancement',
  docs: 'enhancement',
  build: 'enhancement',
  ci: 'enhancement',
  test: 'enhancement',
};

/** Conventional commit regex: type(scope): subject */
const CONVENTIONAL_RE = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/;

function git(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', timeout: 30_000 }).trim();
}

function isGitAvailable(): boolean {
  try {
    git('git rev-parse --is-inside-work-tree');
    return true;
  } catch {
    return false;
  }
}

function getPackageVersion(): string {
  try {
    const pkgPath = resolve(process.cwd(), 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
      return pkg.version || '0.3.0';
    }
  } catch {
    // fallback
  }
  return '0.3.0';
}

function parseCommitMessage(message: string): ChangelogEntry {
  const match = message.match(CONVENTIONAL_RE);
  if (match) {
    const [, type, scope, subject] = match;
    const category = CATEGORY_MAP[type!.toLowerCase()] ?? 'enhancement';
    return {
      category,
      title: subject!.charAt(0).toUpperCase() + subject!.slice(1),
      ...(scope ? { scope } : {}),
    };
  }
  // Non-conventional commit — treat as enhancement
  return {
    category: 'enhancement',
    title: message.charAt(0).toUpperCase() + message.slice(1),
  };
}

/**
 * Manual historical releases for versions before git tagging.
 * These are included as a seed so the page has content from day one.
 */
const HISTORICAL_RELEASES: ChangelogRelease[] = [
  {
    version: '0.1.0',
    date: '2025-01-15',
    entries: [
      { category: 'feature', title: 'Initial release with Salah tracking', scope: 'salah' },
      { category: 'feature', title: 'Quran reading log with page and surah tracking', scope: 'quran' },
      { category: 'feature', title: 'Dhikr counter with customizable presets', scope: 'dhikr' },
      { category: 'feature', title: 'Daily habit tracker with reward points', scope: 'habits' },
      { category: 'feature', title: 'Daily checklist for custom tasks', scope: 'checklist' },
      { category: 'feature', title: 'Multi-language support: English, Bengali, Arabic', scope: 'i18n' },
      { category: 'feature', title: 'Dark mode and light mode with theme toggle', scope: 'ui' },
    ],
  },
  {
    version: '0.2.0',
    date: '2025-06-01',
    entries: [
      { category: 'feature', title: 'Admin panel with user management and analytics', scope: 'admin' },
      { category: 'feature', title: 'AI assistant for worship guidance', scope: 'ai' },
      { category: 'feature', title: 'Interactive onboarding flow for new users', scope: 'onboarding' },
      { category: 'enhancement', title: 'Improved Salah scoring with Awwal/Mid/Last windows', scope: 'salah' },
      { category: 'enhancement', title: 'Worship heatmap and streak tracking', scope: 'stats' },
      { category: 'fix', title: 'Fixed timezone handling for prayer time calculations', scope: 'salah' },
    ],
  },
];

function getFallbackChangelog(): ChangelogRelease[] | null {
  const paths = [
    resolve(process.cwd(), 'src', 'data', 'changelog.json'),
    resolve(process.cwd(), 'changelog.json'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8');
        const parsed = JSON.parse(content) as ChangelogRelease[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[changelog] Loaded pre-generated fallback changelog from ${p}`);
          return parsed;
        }
      } catch {
        // continue
      }
    }
  }
  return null;
}

function getUnreleasedVersionLabel(latestTagVersion: string): string {
  const parts = latestTagVersion.split('.').map((v) => parseInt(v, 10));
  if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
    return `${parts[0]}.${parts[1]}.${parts[2]! + 1}`;
  }
  return `${latestTagVersion}`;
}

function generate(): ChangelogRelease[] {
  if (!isGitAvailable()) {
    const fallback = getFallbackChangelog();
    if (fallback) return fallback;
    console.warn('[changelog] Git not available & no saved changelog found — using historical releases');
    return HISTORICAL_RELEASES;
  }

  // Get all v* tags sorted by version (most recent first)
  let tagsRaw = '';
  try {
    tagsRaw = git('git tag -l "v*" --sort=-version:refname');
  } catch {
    console.warn('[changelog] Could not read git tags — falling back');
  }

  const tags = tagsRaw.split('\n').filter(Boolean);
  const releases: ChangelogRelease[] = [];
  const today = new Date().toISOString().split('T')[0]!;

  if (tags.length > 0) {
    // 1. Check for unreleased commits between latest tag and HEAD
    const latestTag = tags[0]!;
    let unreleasedRaw = '';
    try {
      unreleasedRaw = git(`git log --oneline --format="%s" "${latestTag}..HEAD"`);
    } catch {
      unreleasedRaw = '';
    }

    const unreleasedCommits = unreleasedRaw.split('\n').filter(Boolean);
    const unreleasedEntries = unreleasedCommits
      .map(parseCommitMessage)
      .filter((e) => !e.title.toLowerCase().startsWith('merge'));

    if (unreleasedEntries.length > 0) {
      const latestVersion = latestTag.replace(/^v/, '');
      releases.push({
        version: getUnreleasedVersionLabel(latestVersion),
        date: today,
        entries: unreleasedEntries,
      });
    }

    // 2. Parse commits between tags
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i]!;
      const version = tag.replace(/^v/, '');

      let dateStr: string;
      try {
        dateStr = git(`git log -1 --format=%aI "${tag}"`);
      } catch {
        dateStr = new Date().toISOString();
      }

      const olderTag = tags[i + 1];
      let commitsRaw = '';
      try {
        if (olderTag) {
          commitsRaw = git(`git log --oneline --format="%s" "${olderTag}..${tag}"`);
        } else {
          commitsRaw = git(`git log --oneline --format="%s" "${tag}"`);
        }
      } catch {
        commitsRaw = '';
      }

      const commits = commitsRaw.split('\n').filter(Boolean);
      const entries = commits.map(parseCommitMessage);
      const meaningfulEntries = entries.filter(
        (e) => !e.title.toLowerCase().startsWith('merge'),
      );

      if (meaningfulEntries.length > 0) {
        releases.push({
          version,
          date: dateStr.split('T')[0]!,
          entries: meaningfulEntries,
        });
      }
    }
  } else {
    // No tags found — check all commits up to HEAD
    let allCommitsRaw = '';
    try {
      allCommitsRaw = git('git log --oneline --format="%s" HEAD');
    } catch {
      allCommitsRaw = '';
    }

    const commits = allCommitsRaw.split('\n').filter(Boolean);
    const entries = commits
      .map(parseCommitMessage)
      .filter((e) => !e.title.toLowerCase().startsWith('merge'));

    if (entries.length > 0) {
      const pkgVer = getPackageVersion();
      releases.push({
        version: `${pkgVer}`,
        date: today,
        entries,
      });
    }
  }

  // Append historical releases for versions not covered by tags
  const taggedVersions = new Set(releases.map((r) => r.version.replace(/\s*\(.*\)$/, '')));
  for (const hist of HISTORICAL_RELEASES) {
    if (!taggedVersions.has(hist.version)) {
      releases.push(hist);
    }
  }

  // Sort by date descending (newest first)
  releases.sort((a, b) => b.date.localeCompare(a.date));

  return releases;
}

// --- Main ---
try {
  const changelog = generate();
  const outDir = resolve(process.cwd(), 'dist');
  const srcDataDir = resolve(process.cwd(), 'src', 'data');

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  if (!existsSync(srcDataDir)) {
    mkdirSync(srcDataDir, { recursive: true });
  }

  const jsonStr = JSON.stringify(changelog, null, 2);

  // Write to dist
  const outPath = resolve(outDir, 'changelog.json');
  writeFileSync(outPath, jsonStr, 'utf-8');

  // Write to src/data so it can be committed to git and accessible in Dokploy
  const srcDataPath = resolve(srcDataDir, 'changelog.json');
  writeFileSync(srcDataPath, jsonStr, 'utf-8');

  console.log(`[changelog] Generated ${changelog.length} release(s) → ${outPath} & ${srcDataPath}`);
} catch (err) {
  console.warn('[changelog] Failed to generate changelog — writing empty array', err);
  const outDir = resolve(process.cwd(), 'dist');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(resolve(outDir, 'changelog.json'), '[]', 'utf-8');
}

