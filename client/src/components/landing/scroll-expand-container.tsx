'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollExpandContainerProps {
  children: ReactNode;
  className?: string;
}

export function ScrollExpandContainer({ children, className }: ScrollExpandContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Progress starts when top of container enters lower 85% of viewport
      // and reaches 1.0 when container top reaches 20% from top of viewport
      const start = windowHeight * 0.85;
      const end = windowHeight * 0.2;

      const current = rect.top;
      const progress = Math.min(1, Math.max(0, (start - current) / (start - end)));

      setScrollProgress(progress);
    };

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Minimal 3D transform values driven by scroll progress
  // Scale grows from 0.91 -> 1.0
  // RotateX flattens from 8deg -> 0deg
  const scale = 0.91 + scrollProgress * 0.09;
  const rotateX = (1 - scrollProgress) * 8;
  const opacity = 0.88 + scrollProgress * 0.12;

  return (
    <div
      ref={containerRef}
      style={{ perspective: '1200px' }}
      className={cn('w-full transition-all duration-150 ease-out', className)}
    >
      <div
        style={{
          transform: `perspective(1200px) rotateX(${rotateX}deg) scale(${scale})`,
          opacity,
          transformOrigin: 'center top',
          willChange: 'transform, opacity',
        }}
        className="transition-transform duration-200 ease-out"
      >
        {children}
      </div>
    </div>
  );
}
