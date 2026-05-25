import { cn } from '@/lib/utils';

/**
 * An 8-pointed Islamic star (Khatim) tile, rendered as a subtle, looping
 * SVG decoration. Used as a background ornament on hero / auth panels.
 *
 * Pure CSS / SVG — no external assets, no JS.
 */
export function GeometricPattern({
  className,
  opacity = 0.08,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={{ opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="ibadah-khatim"
          x="0"
          y="0"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          {/* 8-pointed star formed by two rotated squares */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
            strokeLinejoin="round"
            transform="translate(32 32)"
          >
            <rect x="-14" y="-14" width="28" height="28" />
            <rect x="-14" y="-14" width="28" height="28" transform="rotate(45)" />
            <circle r="20" />
          </g>
          {/* Tiny accent dot at corners */}
          <circle cx="0" cy="0" r="0.8" fill="currentColor" />
          <circle cx="64" cy="0" r="0.8" fill="currentColor" />
          <circle cx="0" cy="64" r="0.8" fill="currentColor" />
          <circle cx="64" cy="64" r="0.8" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ibadah-khatim)" />
    </svg>
  );
}
