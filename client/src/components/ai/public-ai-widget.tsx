'use client';

import { usePathname } from '@/i18n/routing';
import { AIWidget } from './ai-widget';

/**
 * Public-facing floating AI widget wrapper.
 * Renders on all public pages (Home, About, Features, FAQ, Releases, Privacy, Terms, AI Showcase)
 * and automatically suppresses itself on authenticated dashboard or auth routes.
 */
export function PublicAIWidget() {
  const pathname = usePathname();

  // Exclude dashboard, assistant, and auth pages (which handle their own widget or full page)
  const isExcluded = /^\/(dashboard|salah|quran|hadith|dhikr|habits|checklist|settings|assistant|login|register)(\/|$)/.test(
    pathname,
  );

  if (isExcluded) {
    return null;
  }

  return (
    <AIWidget
      surface="landing"
      liftAboveBottomNav={false}
      greeting="Assalamu alaikum. I'm the Ibadah assistant — happy to answer questions about the app, the scoring rules, or how it might fit into your day."
      suggestions={[
        'What can I do with Ibadah?',
        'How does the Salah scoring work?',
        'Is my worship log private?',
      ]}
    />
  );
}
