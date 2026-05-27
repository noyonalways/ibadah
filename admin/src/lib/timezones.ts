/**
 * Timezone catalog used by the settings select. Prefers the runtime-
 * native `Intl.supportedValuesOf('timeZone')` (Node 18+, all modern
 * browsers) so the list stays current with the IANA database. Falls
 * back to a curated set of common zones if the runtime lacks it.
 *
 * Zones are returned grouped by region so they render cleanly inside
 * `<optgroup>` elements.
 */

const FALLBACK = [
  'UTC',
  'Africa/Cairo',
  'Africa/Lagos',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Riyadh',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Tehran',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Pacific/Auckland',
];

interface IntlWithSupported {
  supportedValuesOf?: (key: string) => string[];
}

function listAll(): string[] {
  const intl = Intl as unknown as IntlWithSupported;
  if (typeof intl.supportedValuesOf === 'function') {
    try {
      return intl.supportedValuesOf('timeZone');
    } catch {
      /* fall through */
    }
  }
  return FALLBACK;
}

export interface TimezoneGroup {
  region: string;
  zones: { value: string; label: string }[];
}

/**
 * Group zones by their first path segment ("Asia/", "Europe/", etc.). UTC
 * gets its own pseudo-region so it appears at the top.
 */
export function groupedTimezones(): TimezoneGroup[] {
  const all = listAll();
  const groups = new Map<string, TimezoneGroup>();

  // UTC pinned to the top.
  groups.set('UTC', { region: 'UTC', zones: [{ value: 'UTC', label: 'UTC' }] });

  for (const tz of all) {
    if (tz === 'UTC') continue;
    const slash = tz.indexOf('/');
    if (slash === -1) continue; // skip "Etc/..." weirdness without a region

    const region = tz.slice(0, slash);
    const city = tz.slice(slash + 1).replaceAll('_', ' ');
    const existing = groups.get(region) ?? { region, zones: [] };
    existing.zones.push({ value: tz, label: city });
    groups.set(region, existing);
  }

  // Sort regions, sort cities inside each region.
  const ordered: TimezoneGroup[] = [];
  for (const group of groups.values()) {
    group.zones.sort((a, b) => a.label.localeCompare(b.label));
    ordered.push(group);
  }
  // UTC first, then everything alphabetical.
  ordered.sort((a, b) => {
    if (a.region === 'UTC') return -1;
    if (b.region === 'UTC') return 1;
    return a.region.localeCompare(b.region);
  });
  return ordered;
}

/** Best-effort detection of the user's local IANA zone. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
