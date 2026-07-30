'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  stagger?: number;
  threshold?: number;
  as?: 'div' | 'ol' | 'ul';
}

/**
 * Reveals direct children with a staggered blur-up animation when the
 * container scrolls into view. Each child should be a single element
 * (or wrap content in a div) — delays are applied via nth-child CSS.
 */
export function StaggerReveal({
  children,
  className,
  stagger = 90,
  threshold = 0.12,
  as: Tag = 'div',
}: StaggerRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    // Check if element is already within or near viewport on initial mount
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100 && rect.bottom > 0) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px 50px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn('stagger-reveal', revealed && 'is-revealed', className)}
      style={{ '--stagger': `${stagger}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
