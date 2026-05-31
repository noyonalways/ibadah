import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — defines how Ibadah installs as a PWA.
 *
 * - `start_url` and `scope` are root-level so the next-intl middleware
 *   can resolve the user's locale on launch.
 * - Both 192/512 standard icons and a 512 maskable variant are included
 *   so Android can render proper adaptive icons.
 * - Shortcuts surface the four most-used dashboard pages directly from
 *   the home-screen long-press menu.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Ibadah — Journey Towards Allah',
    short_name: 'Ibadah',
    description:
      'A mindful Islamic tracker for Salah, Quran, Dhikr, daily habits, and checklists — with streaks, heatmaps, and weekly goals.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    background_color: '#0a1f1a',
    theme_color: '#0f6e54',
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    categories: ['lifestyle', 'productivity', 'health', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      // Dynamic Next.js routes — give Chromium a small PNG fallback for
      // icon decoding paths that don't yet support SVG.
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Open dashboard',
        short_name: 'Dashboard',
        description: 'Today’s rings and weekly summary',
        url: '/?from=shortcut-dashboard',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
      {
        name: 'Log Salah',
        short_name: 'Salah',
        description: 'Track Fard, Sunnah, Witr, and Friday Jummah',
        url: '/?from=shortcut-salah&go=salah',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
      {
        name: 'Quran reading',
        short_name: 'Quran',
        description: 'Log pages and minutes',
        url: '/?from=shortcut-quran&go=quran',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
      {
        name: 'Dhikr counter',
        short_name: 'Dhikr',
        description: 'Tap to count',
        url: '/?from=shortcut-dhikr&go=dhikr',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
    ],
    prefer_related_applications: false,
  };
}
