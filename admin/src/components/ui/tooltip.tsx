'use client';

/**
 * Tiny CSS-only tooltip — shows on hover/focus of the wrapped trigger.
 *
 * We don't pull in Radix Tooltip just to label icons in the collapsed
 * sidebar. The API surface mirrors the Radix one closely (`Tooltip`,
 * `TooltipTrigger asChild`, `TooltipContent`, `TooltipProvider`) so we
 * could swap to Radix later without touching call sites.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

interface Ctx {
  delay: number;
}
const TooltipCtx = React.createContext<Ctx>({ delay: 250 });

export function TooltipProvider({
  children,
  delayDuration = 250,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  const value = React.useMemo(() => ({ delay: delayDuration }), [delayDuration]);
  return <TooltipCtx.Provider value={value}>{children}</TooltipCtx.Provider>;
}

interface TooltipState {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerId: string;
  contentId: string;
  delay: number;
}
const TooltipInstance = React.createContext<TooltipState | null>(null);

export function Tooltip({ children }: { children: React.ReactNode }) {
  const { delay } = React.useContext(TooltipCtx);
  const [open, setOpen] = React.useState(false);
  const triggerId = React.useId();
  const contentId = React.useId();
  const value = React.useMemo<TooltipState>(
    () => ({ open, setOpen, triggerId, contentId, delay }),
    [open, triggerId, contentId, delay],
  );
  return (
    <TooltipInstance.Provider value={value}>
      <span className="relative inline-flex">{children}</span>
    </TooltipInstance.Provider>
  );
}

interface TriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}

export function TooltipTrigger({ children }: TriggerProps) {
  const ctx = React.useContext(TooltipInstance);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!ctx) return children;

  const open = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => ctx.setOpen(true), ctx.delay);
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    ctx.setOpen(false);
  };

  type ChildProps = React.HTMLAttributes<HTMLElement> & {
    'aria-describedby'?: string;
  };
  const original = (children.props ?? {}) as ChildProps;
  return React.cloneElement<ChildProps>(children as React.ReactElement<ChildProps>, {
    'aria-describedby': ctx.open ? ctx.contentId : undefined,
    onMouseEnter: (e) => {
      original.onMouseEnter?.(e);
      open();
    },
    onMouseLeave: (e) => {
      original.onMouseLeave?.(e);
      close();
    },
    onFocus: (e) => {
      original.onFocus?.(e);
      ctx.setOpen(true);
    },
    onBlur: (e) => {
      original.onBlur?.(e);
      close();
    },
  });
}

interface ContentProps {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function TooltipContent({
  children,
  side = 'right',
  className,
}: ContentProps) {
  const ctx = React.useContext(TooltipInstance);
  if (!ctx || !ctx.open) return null;

  const sidePos: Record<NonNullable<ContentProps['side']>, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      role="tooltip"
      id={ctx.contentId}
      className={cn(
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border/60 bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        sidePos[side],
        className,
      )}
    >
      {children}
    </span>
  );
}
