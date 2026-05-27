/**
 * Font loader for `next/og` ImageResponse.
 *
 * Why this exists
 * ---------------
 * Satori (the renderer behind `next/og`) ships its own Arabic shaper
 * which crashes on most real Arabic fonts:
 *
 *   Error: lookupType: 5 - substFormat: 3 is not yet supported
 *
 * That bug fires inside `arabicRequiredLigatures` for ANY Arabic text,
 * regardless of which font is supplied — Amiri, Noto Naskh, Reem Kufi
 * all trigger it. There is no safe way around it from userland today,
 * so we simply don't render Arabic glyphs in OG cards (callers should
 * pass a transliteration or skip the accent line).
 *
 * What we do load
 * ---------------
 *   - Inter         → Latin (always)
 *   - Hind Siliguri → Bengali (only when text contains Bengali)
 */

// We force Google Fonts to return TTF (not WOFF2) by pretending to be an
// older browser. WOFF2 was introduced in Chrome 36 and standardized later;
// Chrome 41 / Safari 7 era UAs reliably get TTF back, which Satori parses
// natively without a wasm decoder.
const FALLBACK_UA =
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';

// Format preference, best→worst for Satori. TTF/OTF are parsed natively;
// WOFF/WOFF2 work in newer @vercel/og versions but only as a fallback.
const FORMAT_PATTERNS = [
  /src:\s*url\(([^)]+?)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/i,
  /src:\s*url\(([^)]+?)\)\s*format\(['"]?(?:woff2|woff)['"]?\)/i,
  // Last-ditch: any `src: url(...)` — Satori autodetects from the bytes.
  /src:\s*url\(([^)]+?)\)/i,
];

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const BENGALI_RANGE = /[\u0980-\u09FF]/;

/**
 * Strip Arabic codepoints. Satori's shaper crashes on them and there is
 * currently no font choice that avoids the bug. Callers should run any
 * user-supplied / locale-supplied text through this before passing it
 * into `renderOgCard`.
 */
export function stripArabic(input: string | undefined): string {
  if (!input) return '';
  return input.replace(ARABIC_RANGE, '').replace(/\s+/g, ' ').trim();
}

type FontWeight = 400 | 500 | 600 | 700;

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  style: 'normal';
  weight: FontWeight;
};

/**
 * Hit Google Fonts' CSS endpoint for a single font subset, then fetch the
 * binary. The `text=` parameter constrains the subset to exactly the
 * glyphs we'll render — keeps payloads small and gives us a deterministic
 * single-file response (no unicode-range fragmentation).
 *
 * The User-Agent is what controls the format. With a modern Chrome UA the
 * css2 endpoint returns WOFF2 only; older UAs return TTF. We accept both
 * (Satori autodetects from bytes), preferring TTF when available.
 */
async function fetchGoogleFont(
  family: string,
  weight: FontWeight,
  text: string,
): Promise<ArrayBuffer> {
  const familyParam = family.replace(/ /g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&text=${encodeURIComponent(text)}&display=swap`;

  const cssRes = await fetch(url, {
    headers: { 'User-Agent': FALLBACK_UA },
    // Cache aggressively — the same font subset is reused across hits.
    cache: 'force-cache',
  });
  if (!cssRes.ok) {
    throw new Error(`Google Fonts CSS ${cssRes.status} for ${family}@${weight}`);
  }
  const css = await cssRes.text();

  let fontUrl: string | undefined;
  for (const pattern of FORMAT_PATTERNS) {
    const match = css.match(pattern);
    if (match) {
      fontUrl = match[1].trim();
      break;
    }
  }
  if (!fontUrl) {
    throw new Error(
      `No font url found in Google Fonts CSS for ${family}@${weight}`,
    );
  }

  const binRes = await fetch(fontUrl, { cache: 'force-cache' });
  if (!binRes.ok) {
    throw new Error(`Could not download ${family}@${weight} (${binRes.status})`);
  }
  return binRes.arrayBuffer();
}

function dedupe(text: string): string {
  return Array.from(new Set(text)).join('');
}

async function tryLoad(
  family: string,
  weight: FontWeight,
  text: string,
  out: OgFont[],
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    const data = await fetchGoogleFont(family, weight, dedupe(trimmed));
    out.push({ name: family, data, style: 'normal', weight });
  } catch (err) {
    // Don't fail the whole render — Satori will fall back to its default
    // for any glyphs without coverage and we still produce a card.
    console.warn(`[og-fonts] failed to load ${family} ${weight}:`, err);
  }
}

/**
 * Load just enough fonts to render the given text without script gaps.
 *
 * Always loads Inter (Latin). Conditionally loads:
 *   - Hind Siliguri → if any Bengali codepoints appear in `primary`
 *
 * Arabic is intentionally not loaded — see the file header for why.
 */
export async function loadOgFonts(input: {
  primary: string;
}): Promise<OgFont[]> {
  const { primary } = input;
  const fonts: OgFont[] = [];

  // ----- Latin -----
  // A small alphabet seed so brand/url/etc always have glyph coverage,
  // even when `primary` is non-Latin (e.g. a Bengali-only title).
  const latinSeed =
    'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789 .,:;—·-/—()@&!?';
  const latinText =
    primary.replace(/[^\u0000-\u024F\u2000-\u206F]/g, '') + latinSeed;

  await Promise.all([
    tryLoad('Inter', 400, latinText, fonts),
    tryLoad('Inter', 700, latinText, fonts),
  ]);

  // ----- Bengali -----
  if (BENGALI_RANGE.test(primary)) {
    const bengaliText =
      primary.match(/[\u0980-\u09FF\u0020]/g)?.join('') ?? '';
    await Promise.all([
      tryLoad('Hind Siliguri', 400, bengaliText, fonts),
      tryLoad('Hind Siliguri', 700, bengaliText, fonts),
    ]);
  }

  return fonts;
}
