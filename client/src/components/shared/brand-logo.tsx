import { cn } from '@/lib/utils';

/**
 * The Ibadah brand logomark — a unique geometric composition:
 *
 *   • Outer: rounded square with the brand gradient (emerald → gold → twilight)
 *   • Middle: an 8-pointed Khatim star (Khātim Sulaymānī), the seal of
 *     remembrance, drawn as two interlocked rotated squares
 *   • Inner: a delicate crescent caressing a small accent star, the two
 *     classical motifs of Islamic identity
 *   • A halo ring on hover/focus to read as luminous, not flat
 *
 * Designed to be readable from 16px (favicon) up to 512px (OG card).
 *
 * `variant`:
 *   - 'mark'  — only the inner geometry (transparent background)
 *   - 'badge' — full rounded gradient frame (default)
 */
export function BrandLogo({
  className,
  size = 40,
  variant = 'badge',
  animate = false,
}: {
  className?: string;
  size?: number;
  variant?: 'mark' | 'badge';
  animate?: boolean;
}) {
  const isBadge = variant === 'badge';

  return (
    <span
      role="img"
      aria-label="Ibadah"
      className={cn(
        'relative inline-grid place-items-center',
        isBadge &&
          'overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-soft to-accent-deep text-white shadow-lg shadow-primary/30',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* Soft inner highlight, only on the badge variant */}
      {isBadge && (
        <>
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/25 via-transparent to-transparent" />
          <span className="absolute -inset-px rounded-2xl ring-1 ring-inset ring-white/10" />
          {animate && (
            <span className="absolute inset-0 rounded-2xl animate-glow-pulse" aria-hidden />
          )}
        </>
      )}

      <svg
        viewBox="0 0 64 64"
        width={size * (isBadge ? 0.7 : 1)}
        height={size * (isBadge ? 0.7 : 1)}
        className={cn('relative', !isBadge && 'text-primary')}
        fill="none"
        aria-hidden
      >
        <defs>
          {!isBadge && (
            <linearGradient id="ib-mark-stroke" x1="0" y1="0" x2="64" y2="64">
              <stop offset="0%" stopColor="currentColor" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
            </linearGradient>
          )}
        </defs>

        <g
          stroke={isBadge ? 'white' : 'url(#ib-mark-stroke)'}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Outer 8-pointed Khatim star — two interlocked squares */}
          <g transform="translate(32 32)" strokeWidth="2.4">
            <rect x="-19" y="-19" width="38" height="38" rx="2" />
            <rect
              x="-19"
              y="-19"
              width="38"
              height="38"
              rx="2"
              transform="rotate(45)"
              opacity="0.85"
            />
          </g>

          {/* Faint guide circle inside the star */}
          <circle cx="32" cy="32" r="14" strokeWidth="1" opacity="0.35" />

          {/* Crescent — opens to the right, hugging an accent star */}
          <path
            d="M36 24 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16 z"
            strokeWidth="2.2"
            fill={isBadge ? 'white' : 'currentColor'}
            fillOpacity={isBadge ? 0.95 : 0.85}
            stroke="none"
          />

          {/* Accent star nestled in the crescent's curve */}
          <g transform="translate(40 32)" strokeWidth="0">
            <path
              d="M0 -3.6 L0.9 -0.9 L3.6 0 L0.9 0.9 L0 3.6 L-0.9 0.9 L-3.6 0 L-0.9 -0.9 Z"
              fill={isBadge ? 'white' : 'currentColor'}
              fillOpacity={isBadge ? 0.9 : 0.85}
            />
          </g>
        </g>
      </svg>
    </span>
  );
}
