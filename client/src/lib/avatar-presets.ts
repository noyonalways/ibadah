/**
 * Preset avatar gallery — a small set of Islamic-themed gradient swatches
 * with a single centered glyph. Each one is encoded as an inline SVG
 * data URL so it renders without any network request.
 *
 * The same data URL flows through the user-profile API path as a
 * user-uploaded photo would, keeping the storage model uniform.
 */

interface PresetSpec {
  id: string;
  /** Two stop colors for the diagonal gradient. */
  from: string;
  to: string;
  /**
   * SVG fragment placed inside the 64×64 viewBox. Should center on
   * (32,32) and use white at varying opacities so the mark reads on top
   * of any gradient.
   */
  glyph: string;
}

const PRESETS: PresetSpec[] = [
  {
    // Khatim 8-pointed star — interlocked squares
    id: 'khatim-emerald',
    from: '#0f6e54',
    to: '#c8923a',
    glyph: `
      <g transform="translate(32 32)" stroke="white" stroke-width="2.4" fill="none" stroke-linejoin="round">
        <rect x="-15" y="-15" width="30" height="30" rx="2" />
        <rect x="-15" y="-15" width="30" height="30" rx="2" transform="rotate(45)" opacity="0.85" />
      </g>`,
  },
  {
    // Crescent + accent star
    id: 'crescent-twilight',
    from: '#1e3a8a',
    to: '#7c3aed',
    glyph: `
      <path d="M36 22 a10 10 0 1 0 0 20 a8 8 0 1 1 0 -20 z" fill="white" fill-opacity="0.95" />
      <path d="M44 26 L45.2 28.8 L48 30 L45.2 31.2 L44 34 L42.8 31.2 L40 30 L42.8 28.8 Z" fill="white" fill-opacity="0.9" />`,
  },
  {
    // Mihrab arch silhouette
    id: 'mihrab-amber',
    from: '#92400e',
    to: '#d97706',
    glyph: `
      <path d="M22 44 L22 30 a10 10 0 0 1 20 0 L42 44 Z" fill="white" fill-opacity="0.9" />
      <circle cx="32" cy="22" r="2.5" fill="white" />`,
  },
  {
    // 5 pillars — five vertical bars
    id: 'pillars-rose',
    from: '#9f1239',
    to: '#f43f5e',
    glyph: `
      <g fill="white" fill-opacity="0.92">
        <rect x="16" y="22" width="3.5" height="20" rx="1.5" />
        <rect x="22" y="22" width="3.5" height="20" rx="1.5" />
        <rect x="28" y="22" width="3.5" height="20" rx="1.5" />
        <rect x="34" y="22" width="3.5" height="20" rx="1.5" />
        <rect x="40" y="22" width="3.5" height="20" rx="1.5" />
      </g>
      <rect x="14" y="20" width="36" height="2" rx="1" fill="white" fill-opacity="0.95" />`,
  },
  {
    // Geometric tile — six-petal rosette
    id: 'rosette-teal',
    from: '#0d9488',
    to: '#22d3ee',
    glyph: `
      <g transform="translate(32 32)" fill="none" stroke="white" stroke-width="2" stroke-opacity="0.95">
        <circle r="11" />
        <circle r="11" transform="translate(8 0)" />
        <circle r="11" transform="translate(-8 0)" />
        <circle r="11" transform="translate(4 7)" />
        <circle r="11" transform="translate(-4 7)" />
        <circle r="11" transform="translate(4 -7)" />
        <circle r="11" transform="translate(-4 -7)" />
      </g>`,
  },
  {
    // Sunrise — Fajr feel
    id: 'sunrise-dawn',
    from: '#be185d',
    to: '#fb923c',
    glyph: `
      <circle cx="32" cy="40" r="10" fill="white" fill-opacity="0.92" />
      <g stroke="white" stroke-width="2" stroke-linecap="round" stroke-opacity="0.9">
        <line x1="14" y1="40" x2="50" y2="40" />
        <line x1="32" y1="20" x2="32" y2="26" />
        <line x1="20" y1="24" x2="24" y2="28" />
        <line x1="44" y1="24" x2="40" y2="28" />
      </g>`,
  },
  {
    // Tasbih beads — 9 dots in a curve
    id: 'tasbih-indigo',
    from: '#312e81',
    to: '#4338ca',
    glyph: `
      <g fill="white" fill-opacity="0.95">
        <circle cx="20" cy="32" r="2.4" />
        <circle cx="22" cy="38" r="2.4" />
        <circle cx="26" cy="42" r="2.4" />
        <circle cx="32" cy="44" r="2.4" />
        <circle cx="38" cy="42" r="2.4" />
        <circle cx="42" cy="38" r="2.4" />
        <circle cx="44" cy="32" r="2.4" />
        <circle cx="32" cy="22" r="3.2" />
      </g>`,
  },
  {
    // Open Quran — two pages with a binding
    id: 'mushaf-leaf',
    from: '#166534',
    to: '#65a30d',
    glyph: `
      <g fill="white" fill-opacity="0.95">
        <path d="M14 24 L30 22 L30 44 L14 42 Z" />
        <path d="M50 24 L34 22 L34 44 L50 42 Z" />
      </g>
      <line x1="32" y1="22" x2="32" y2="44" stroke="white" stroke-width="1.5" stroke-opacity="0.6" />`,
  },
];

function buildPreset(p: PresetSpec): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g-${p.id}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${p.from}" />
      <stop offset="100%" stop-color="${p.to}" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#g-${p.id})" />
  ${p.glyph}
</svg>`.trim();
  // Inline SVG must use UTF-8 percent-encoding (not base64) — keeps the
  // string both tiny and readable in the user document.
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface AvatarPreset {
  id: string;
  dataUrl: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = PRESETS.map((p) => ({
  id: p.id,
  dataUrl: buildPreset(p),
}));
