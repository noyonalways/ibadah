import { GeometricPattern } from '@/components/shared/geometric-pattern';

export function MarketingBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-grid opacity-35" />
      <GeometricPattern className="text-primary" opacity={0.03} />

      <div className="absolute -left-32 top-[-10vh] h-[50vh] w-[50vh] rounded-full bg-primary/18 blur-3xl animate-breathe-slow" />
      <div
        className="absolute -right-32 top-[5vh] h-[45vh] w-[45vh] rounded-full bg-accent/14 blur-3xl animate-breathe-slow"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="absolute left-1/2 top-[55vh] h-[55vh] w-[55vh] -translate-x-1/2 rounded-full bg-tertiary/12 blur-3xl animate-breathe-slow"
        style={{ animationDelay: '6s' }}
      />
    </div>
  );
}
