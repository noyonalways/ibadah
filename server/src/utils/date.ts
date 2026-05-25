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
