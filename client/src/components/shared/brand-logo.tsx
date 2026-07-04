import { cn } from '@/lib/utils';

/** Canonical brand badge — `/public/icons/icon-512.svg`. */
const BRAND_LOGO_SRC = '/icons/icon-512.svg';

/**
 * The Ibadah brand logomark.
 *
 * `variant`:
 *   - 'badge' — full rounded gradient frame from `icon-512.svg` (default)
 *   - 'mark'  — inner geometry only (transparent background, theme-colored)
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

  if (isBadge) {
    return (
      <span
        role="img"
        aria-label="Ibadah"
        className={cn('relative inline-block shrink-0', className)}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO_SRC}
          alt=""
          width={size}
          height={size}
          className="size-full"
          aria-hidden
        />
        {animate && (
          <span className="absolute inset-0 rounded-[22%] animate-glow-pulse" aria-hidden />
        )}
      </span>
    );
  }

  // Inner geometry from icon-512.svg — no background frame.
  return (
    <span
      role="img"
      aria-label="Ibadah"
      className={cn('relative inline-block shrink-0 text-primary', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="size-full"
        fill="none"
        aria-hidden
      >
        <g
          transform="translate(256 256)"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="6"
          fill="none"
        >
          <rect x="-114" y="-114" width="228" height="228" rx="14" />
          <rect
            x="-114"
            y="-114"
            width="228"
            height="228"
            rx="14"
            transform="rotate(45)"
            opacity="0.78"
          />
          <circle cx="0" cy="0" r="84" strokeWidth="3" opacity="0.45" />
        </g>
        <path
          d="M288 192 a72 72 0 1 0 0 128 a56 56 0 1 1 0 -128 z"
          fill="currentColor"
        />
        <path
          d="M320 224 L327.2 242.4 L345.6 249.6 L327.2 256.8 L320 275.2 L312.8 256.8 L294.4 249.6 L312.8 242.4 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
