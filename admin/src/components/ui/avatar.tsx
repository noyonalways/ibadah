import { cn, getInitials } from '@/lib/utils';

const isUsableImageUrl = (v?: string | null): v is string =>
  !!v && (v.startsWith('http') || v.startsWith('data:image/'));

/**
 * Display-only avatar primitive. Image when available, otherwise the
 * brand-gradient bubble with two-letter initials. Mirrors
 * client/src/components/ui/avatar.tsx.
 */
export function Avatar({
  src,
  name,
  size = 40,
  rounded = 'full',
  className,
}: {
  src?: string;
  name?: string;
  size?: number;
  rounded?: 'full' | '2xl' | 'xl' | 'lg';
  className?: string;
}) {
  const radius =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === '2xl'
        ? 'rounded-2xl'
        : rounded === 'xl'
          ? 'rounded-xl'
          : 'rounded-lg';

  if (isUsableImageUrl(src)) {
    return (
      <span
        className={cn('relative inline-grid place-items-center overflow-hidden', radius, className)}
        style={{ width: size, height: size }}
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

  return (
    <span
      className={cn(
        'relative inline-grid place-items-center bg-gradient-to-br from-primary via-primary-soft to-accent-deep font-semibold text-primary-foreground shadow-sm',
        radius,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
    >
      {getInitials(name)}
    </span>
  );
}
