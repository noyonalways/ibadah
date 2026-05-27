import { cn } from '@/lib/utils';

/**
 * Ibadah logomark — verbatim copy of client/src/components/shared/brand-logo.tsx
 * (badge variant only, since the admin doesn't use the bare mark form).
 *
 *   • Outer rounded square with the brand gradient (emerald → soft → gold)
 *   • Khatim Sulaymani — two interlocked rotated squares (8-pointed star)
 *   • Crescent + accent star nested inside
 */
export function BrandMark({
  size = 36,
  animate = false,
  className,
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Ibadah Admin"
      className={cn(
        'relative inline-grid place-items-center overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-primary via-primary-soft to-accent-deep text-white shadow-lg shadow-primary/30',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/25 via-transparent to-transparent" />
      <span className="absolute -inset-px rounded-2xl ring-1 ring-inset ring-white/10" />
      {animate && <span className="absolute inset-0 rounded-2xl animate-glow-pulse" aria-hidden />}

      <svg
        viewBox="0 0 64 64"
        width={size * 0.7}
        height={size * 0.7}
        className="relative"
        fill="none"
        aria-hidden
      >
        <g stroke="white" strokeLinejoin="round" strokeLinecap="round">
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
          <circle cx="32" cy="32" r="14" strokeWidth="1" opacity="0.35" />
          <path
            d="M36 24 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16 z"
            strokeWidth="2.2"
            fill="white"
            fillOpacity={0.95}
            stroke="none"
          />
          <g transform="translate(40 32)" strokeWidth="0">
            <path
              d="M0 -3.6 L0.9 -0.9 L3.6 0 L0.9 0.9 L0 3.6 L-0.9 0.9 L-3.6 0 L-0.9 -0.9 Z"
              fill="white"
              fillOpacity={0.9}
            />
          </g>
        </g>
      </svg>
    </span>
  );
}
