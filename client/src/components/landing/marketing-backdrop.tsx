import { GeometricPattern } from '@/components/shared/geometric-pattern';

/**
 * A single, full-page backdrop for the marketing surface. By rendering one
 * continuous layer (instead of a per-section gradient) we avoid visible
 * "section seams" and the page reads as a single fluid scroll.
 *
 * Layers, top → bottom:
 *   1. Soft grid (faded out at top edges)
 *   2. Three breathing color orbs anchored at hero / verse / cta zones
 *   3. Geometric Khatim pattern at low opacity
 *
 * Rendered fixed inside the page so it scrolls in place and never seams.
 */
export function MarketingBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-background" />

      {/* Soft grid — faded at top/bottom by mask */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Subtle Khatim pattern across the whole page */}
      <GeometricPattern className="text-primary" opacity={0.04} />

      {/*
        Color orbs — positioned with vh so they live at meaningful scroll
        depths and breathe gently. Together they create a single, flowing
        gradient rather than per-section ones.
      */}
      <div
        className="absolute -left-32 top-[-12vh] h-[60vh] w-[60vh] rounded-full bg-primary/30 blur-3xl animate-breathe-slow"
      />
      <div
        className="absolute -right-32 top-[5vh] h-[55vh] w-[55vh] rounded-full bg-accent/25 blur-3xl animate-breathe-slow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute left-1/2 top-[60vh] h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-tertiary/20 blur-3xl animate-breathe-slow"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="absolute -left-20 top-[140vh] h-[60vh] w-[60vh] rounded-full bg-accent/20 blur-3xl animate-breathe-slow"
        style={{ animationDelay: '6s' }}
      />
      <div
        className="absolute -right-20 top-[200vh] h-[60vh] w-[60vh] rounded-full bg-primary/25 blur-3xl animate-breathe-slow"
        style={{ animationDelay: '8s' }}
      />
    </div>
  );
}
