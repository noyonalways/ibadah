import { cn } from '@/lib/utils';

/**
 * A circular progress indicator with a soft gradient stroke, an optional
 * inner label, and a luminous outer halo. Inspired by activity rings in
 * fitness apps but tuned for our spiritual palette.
 */
export function ProgressRing({
  value,
  max = 100,
  size = 132,
  thickness = 10,
  label,
  sublabel,
  gradientFrom = 'var(--primary)',
  gradientTo = 'var(--accent)',
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = max === 0 ? 0 : clamped / max;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  const gradientId = `ibadah-ring-${Math.round(Math.random() * 1e6)}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-muted/60"
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && (
          <span className="text-2xl font-semibold tabular-nums leading-none tracking-tight">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
