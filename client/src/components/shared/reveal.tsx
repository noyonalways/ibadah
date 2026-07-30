'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealVariant = 'fade-up' | 'fade-in' | 'fade-right' | 'fade-left' | 'scale-in' | 'blur-up';

interface RevealCommonProps {
  children: ReactNode;
  /** Delay in ms before the reveal triggers (after intersection) */
  delay?: number;
  className?: string;
  /** Animation variant — fade-up is the most common; fade-in is no-translate */
  variant?: RevealVariant;
  /** Intersection threshold (0–1) before the reveal triggers */
  threshold?: number;
  /** Reveal only once (default) or every time it scrolls in/out */
  once?: boolean;
}

/**
 * Reveals its children when they scroll into view.
 *
 * Uses IntersectionObserver to add the `is-revealed` class once. Animation
 * itself is pure CSS (defined in `globals.css`), so this component does
 * ~zero work after the initial reveal.
 *
 * Respects `prefers-reduced-motion` by skipping the animation entirely.
 *
 * Defaults to a `<div>` wrapper. For semantic reveals (e.g. wrapping a
 * `<li>`) use the dedicated `RevealLi`.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  variant = 'fade-up',
  threshold = 0.15,
  once = true,
  as = 'div',
}: RevealCommonProps & { as?: 'div' | 'section' | 'span' | 'li' | 'article' }) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    // Immediately reveal if element is already within or near viewport on mount
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 50 && rect.bottom > 0) {
      setRevealed(true);
      if (once) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold: 0, rootMargin: '0px 0px 50px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  const classes = cn('reveal', `reveal-${variant}`, revealed && 'is-revealed', className);

  // Avoid TS's complex polymorphic union by branching on the literal `as`.
  // This keeps TS happy with no `any` casts.
  switch (as) {
    case 'section':
      return (
        <section
          ref={ref as React.Ref<HTMLElement>}
          className={classes}
          style={style}
        >
          {children}
        </section>
      );
    case 'span':
      return (
        <span ref={ref as React.Ref<HTMLSpanElement>} className={classes} style={style}>
          {children}
        </span>
      );
    case 'li':
      return (
        <li ref={ref as React.Ref<HTMLLIElement>} className={classes} style={style}>
          {children}
        </li>
      );
    case 'article':
      return (
        <article ref={ref as React.Ref<HTMLElement>} className={classes} style={style}>
          {children}
        </article>
      );
    case 'div':
    default:
      return (
        <div ref={ref as React.Ref<HTMLDivElement>} className={classes} style={style}>
          {children}
        </div>
      );
  }
}
