import { cn } from '@/lib/utils';
import { getInitials, isUsableImageUrl } from '@/lib/avatar-utils';

/**
 * Display-only avatar primitive. Shows the user's image when one is set
 * and falls back to a gradient bubble with the user's initials. Used in
 * the topbar, sidebar, mobile bar, and the settings hero.
 */
export function Avatar({
  src,
  name,
  size = 40,
  rounded = 'full',
  className,
  ariaHidden,
}: {
  src?: string;
  name?: string;
  size?: number;
  rounded?: 'full' | '2xl' | 'xl' | 'lg';
  className?: string;
  ariaHidden?: boolean;
}) {
  const showImage = isUsableImageUrl(src);
  const radius =
    rounded === 'full' ? 'rounded-full' : rounded === '2xl' ? 'rounded-2xl' : rounded === 'xl' ? 'rounded-xl' : 'rounded-lg';

  if (showImage) {
    // Plain `<img>` is intentional — avatar URLs are user-controlled
    // (data URLs and arbitrary external URLs both occur), and Next.js
    // remote-image config can't reasonably enumerate them.
    return (
      <span
        className={cn('relative inline-grid place-items-center overflow-hidden', radius, className)}
        style={{ width: size, height: size }}
        aria-hidden={ariaHidden}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ?? ''}
          width={size}
          height={size}
          className="size-full object-cover"
          draggable={false}
        />
      </span>
    );
  }

  // Gradient + initials fallback. Text scales to ~40% of the size.
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center bg-gradient-to-br from-primary via-primary-soft to-accent-deep font-semibold text-primary-foreground shadow-sm',
        radius,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
      aria-hidden={ariaHidden}
    >
      {getInitials(name)}
    </span>
  );
}
