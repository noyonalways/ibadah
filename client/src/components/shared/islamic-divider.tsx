import { cn } from '@/lib/utils';

/**
 * A delicate ornamental divider with a centered 8-pointed star, framed by
 * hairline gradient lines. Used to break sections and add a moment of
 * craftsmanship between content blocks.
 */
export function IslamicDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-4 text-muted-foreground/50', className)}
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.2">
        <g transform="translate(12 12)">
          <rect x="-6" y="-6" width="12" height="12" />
          <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
          <circle r="9" strokeWidth="0.6" opacity="0.4" />
          <circle r="1.2" fill="currentColor" stroke="none" />
        </g>
      </svg>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
