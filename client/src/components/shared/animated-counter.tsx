'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number counting up from `from` to `to` once it enters the
 * viewport. Designed for hero / proof-bar stats.
 *
 * Lightweight: a single rAF loop, scoped to one element. Cancels on
 * unmount or once the target is reached. Honors reduced-motion.
 */
export function AnimatedCounter({
  to,
  from = 0,
  durationMs = 1400,
  format = (n) => n.toLocaleString(),
  suffix = '',
  prefix = '',
  className,
}: {
  to: number;
  from?: number;
  durationMs?: number;
  format?: (n: number) => string;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) {
      setValue(to);
      return;
    }

    let raf = 0;
    let started = false;
    let startTime = 0;

    const tick = (t: number) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);
      setValue(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          raf = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [from, to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(value)}
      {suffix}
    </span>
  );
}
