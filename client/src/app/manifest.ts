import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ibadah — Journey Towards Allah',
    short_name: 'Ibadah',
    description:
      'A mindful Islamic tracker for Salah, Quran, Dhikr, daily habits, and checklists — with streaks, heatmaps, and weekly goals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a1f1a',
    theme_color: '#0f6e54',
    orientation: 'portrait',
    categories: ['lifestyle', 'productivity', 'health', 'education'],
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
