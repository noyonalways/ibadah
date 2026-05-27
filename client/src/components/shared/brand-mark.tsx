import { BrandLogo } from './brand-logo';
import { cn } from '@/lib/utils';

/**
 * Backwards-compatible wrapper around `BrandLogo`. Kept so existing
 * call-sites continue to work; new code should prefer `BrandLogo`.
 */
export function BrandMark({
  className,
  size = 36,
  animate = false,
}: {
  className?: string;
  size?: number;
  animate?: boolean;
}) {
  return <BrandLogo className={cn(className)} size={size} variant="badge" animate={animate} />;
}
