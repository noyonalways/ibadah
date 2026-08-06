'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, X, Minus, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function PWAInstallPrompt() {
  const t = useTranslations('PwaPrompt');
  const [isMinimized, setIsMinimized] = useState(false);
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showPrompt,
    handleInstall,
    handleDismiss,
  } = usePWAInstall();

  if (!showPrompt || isInstalled) {
    return null;
  }

  // Minimized Pill View: Placed at bottom-right (below AI Assistant button)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 animate-in fade-in zoom-in-95 duration-200 rtl:right-auto rtl:left-4 lg:rtl:left-6">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-background/95 px-4 py-2.5 text-xs font-semibold text-emerald-600 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-500/50 hover:bg-emerald-500/10 dark:text-emerald-400"
          aria-label={t('expandButton')}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <Smartphone className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110 dark:text-emerald-400" />
          <span>{t('expandButton')}</span>
        </button>
      </div>
    );
  }

  // Full Prompt Card View: Positioned at bottom-right below AI Assistant button
  return (
    <div
      aria-live="polite"
      role="dialog"
      aria-labelledby="pwa-prompt-title"
      className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 w-[calc(100%-2rem)] max-w-sm sm:max-w-md rounded-2xl border border-emerald-500/20 bg-background/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 rtl:right-auto rtl:left-4 lg:rtl:left-6"
    >
      {/* Header controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          onClick={() => setIsMinimized(true)}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('minimizeButton')}
          title={t('minimizeButton')}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('dismissButton')}
          title={t('dismissButton')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start gap-3.5 pr-14">
        {/* App Icon / Gradient Badge */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
          <Smartphone className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <h3 id="pwa-prompt-title" className="text-base font-semibold text-foreground">
            {isIOS && !isInstallable ? t('iosTitle') : t('title')}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t('description')}
          </p>

          {/* iOS Safari Installation Steps */}
          {isIOS && !isInstallable && (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-foreground/90">
              <p className="flex items-center gap-1.5 leading-snug">
                <span>
                  1.{' '}
                  {t.rich('iosInstructions', {
                    shareIcon: () => (
                      <Share className="inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ),
                    addIcon: () => (
                      <PlusSquare className="inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ),
                  })}
                </span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3.5 flex items-center gap-2">
            {!isIOS && isInstallable && (
              <button
                onClick={handleInstall}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <Download className="h-3.5 w-3.5" />
                {t('installButton')}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
            >
              {t('dismissButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
