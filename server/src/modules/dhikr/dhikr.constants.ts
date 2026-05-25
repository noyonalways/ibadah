/**
 * Default daily dhikr catalog. Users can override targets in settings.
 */
export const DEFAULT_DHIKR_PRESETS = [
  { slug: 'subhanallah', label: 'SubhanAllah', defaultTarget: 33, arabic: 'سُبْحَانَ ٱللَّٰهِ' },
  {
    slug: 'alhamdulillah',
    label: 'Alhamdulillah',
    defaultTarget: 33,
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
  },
  { slug: 'allahuakbar', label: 'Allahu Akbar', defaultTarget: 34, arabic: 'ٱللَّٰهُ أَكْبَرُ' },
  {
    slug: 'lailahaillallah',
    label: 'La ilaha illa Allah',
    defaultTarget: 100,
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
  },
] as const;
