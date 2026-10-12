'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Briefcase, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePublicSiteConfig } from '@/hooks/use-site-config';
import {
  hasSeenRecruiterIntro,
  markRecruiterIntroSeen,
} from '@/lib/recruiter-intro-prefs';
import { RecruiterIntroModal } from './recruiter-intro-modal';

export const RECRUITER_INTRO_DISMISSED_EVENT = 'ibadah:recruiter-intro-dismissed';

export function RecruiterIntroLauncher() {
  const searchParams = useSearchParams();
  const { data, isLoading } = usePublicSiteConfig();
  const introConfig = data?.recruiterIntro;

  const [open, setOpen] = useState(false);
  const [hasCheckedAutoOpen, setHasCheckedAutoOpen] = useState(false);

  const isEnabled = Boolean(introConfig?.enabled);

  useEffect(() => {
    if (isLoading || !isEnabled || hasCheckedAutoOpen) return;

    // Check if query string contains ?intro=1 or ?recruiter=1
    const forcedByUrl =
      searchParams?.get('intro') === '1' || searchParams?.get('recruiter') === '1';

    if (forcedByUrl) {
      setOpen(true);
      setHasCheckedAutoOpen(true);
      return;
    }

    // Otherwise check if new visitor (not seen before in this browser)
    if (!hasSeenRecruiterIntro()) {
      // Small timeout so initial page render and CSS hydration finish smoothly
      const timer = setTimeout(() => {
        setOpen(true);
      }, 350);
      setHasCheckedAutoOpen(true);
      return () => clearTimeout(timer);
    }

    setHasCheckedAutoOpen(true);
  }, [isLoading, isEnabled, searchParams, hasCheckedAutoOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      markRecruiterIntroSeen();
      // Notify mobile landing to show onboarding if pending
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(RECRUITER_INTRO_DISMISSED_EVENT));
      }
    }
  };

  if (!isEnabled || !introConfig) {
    return null;
  }

  return (
    <>
      {/* Floating launcher button: persistent across landing page so visitors can reopen anytime */}
      <div className="fixed z-40 bottom-20 lg:bottom-6 left-4 lg:left-6 rtl:left-auto rtl:right-4 lg:rtl:right-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative h-11 sm:h-12 rounded-full border border-primary/30 bg-background/90 px-3.5 sm:px-4 text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all hover:scale-105 hover:border-primary hover:bg-background/95 active:scale-95 text-foreground"
          aria-label="Open Recruiter and Engineering Brief"
        >
          {/* Subtle glowing halo */}
          <span
            className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 opacity-0 blur group-hover:opacity-100 transition-opacity"
            aria-hidden
          />

          <span className="relative flex items-center gap-2">
            <span className="grid size-6 sm:size-7 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Briefcase className="size-3.5" />
            </span>
            <span className="tracking-tight hidden xs:inline">Recruiter Brief</span>
            <Badge
              variant="default"
              className="ml-0.5 px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider"
            >
              <Sparkles className="mr-0.5 size-2.5 inline" /> Stack & Demo
            </Badge>
          </span>
        </Button>
      </div>

      {/* Recruiter Intro Modal */}
      <RecruiterIntroModal
        open={open}
        onOpenChange={handleOpenChange}
        config={introConfig}
      />
    </>
  );
}
