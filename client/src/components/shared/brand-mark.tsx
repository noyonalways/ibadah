import { cn } from '@/lib/utils';

/**
 * Crescent-and-star brand mark for Ibadah. Rendered with the brand gradient
 * and a soft halo so it reads as a small luminous object — not a flat icon.
 */
export function BrandMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center rounded-xl bg-gradient-to-br from-primary via-primary-soft to-accent-deep text-primary-foreground shadow-md shadow-primary/30',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
      <svg
        viewBox="0 0 24 24"
        width={size * 0.55}
        height={size * 0.55}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative"
        aria-hidden
      >
        {/* Stylized crescent */}
        <path d="M16.5 12.5a6.5 6.5 0 1 1-6.4-6.5A5.2 5.2 0 0 0 16.5 12.5Z" />
        {/* 8-pointed star accent */}
        <g transform="translate(18 6)" strokeWidth="1.2">
          <path d="M0 -2.4 L0 2.4 M-2.4 0 L2.4 0 M-1.7 -1.7 L1.7 1.7 M-1.7 1.7 L1.7 -1.7" />
        </g>
      </svg>
    </span>
  );
}
