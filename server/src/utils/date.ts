/**
 * Normalize a date string (YYYY-MM-DD) or Date to UTC midnight. Daily docs
 * are keyed off this so client/server stay in sync regardless of timezone
 * (clients send their local-day's YYYY-MM-DD).
 */
export function toDayKey(input: string | Date): Date {
  if (input instanceof Date) {
    const d = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
    return d;
  }
  // Expect YYYY-MM-DD
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) throw new Error(`Invalid date string: ${input}`);
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

export function formatDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The current calendar day (YYYY-MM-DD) in a given IANA timezone. This is the
 * user's "today" — anything strictly less than it is a day that has already
 * ended for that user, regardless of UTC offset. Falls back to UTC if the
 * timezone string is missing or invalid.
 */
export function localDayKey(timezone?: string | null, now: Date = new Date()): string {
  const tz = timezone || 'UTC';
  try {
    // `en-CA` formats as YYYY-MM-DD, which is exactly our day-key shape.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  }
}
