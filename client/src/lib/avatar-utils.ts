/**
 * Browser-side avatar handling. Files are resized + compressed to a small
 * data URL so they round-trip through the existing `users.scoring`-style
 * profile API without needing dedicated file-upload infrastructure.
 *
 * Two-letter initials are used as the fallback when no avatar is set.
 */

export const AVATAR_MAX_BYTES = 600_000; // matches server-side validation

/** Two-letter initials from a name string ("Noyon Ahmed" → "NA"). */
export function getInitials(name?: string): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return letters || '·';
}

/**
 * Read a `File` into a Data URL. Wrapped in a Promise because the
 * underlying `FileReader` API is event-based.
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Load a Data URL into an HTMLImageElement. */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = dataUrl;
  });
}

interface CompressOptions {
  /** Longest edge of the output square. Default 256. */
  maxSize?: number;
  /** JPEG quality 0..1. Default 0.85. */
  quality?: number;
  /** Output mime — defaults to image/jpeg, falls back to png if alpha matters. */
  mime?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resize + compress an uploaded image into a square data URL. The image is
 * cover-cropped to a centered square so all avatars look consistent in
 * circular frames regardless of the source aspect ratio.
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image');
  }

  const { maxSize = 256, quality = 0.85, mime = 'image/jpeg' } = options;

  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  // Centered square crop on the smaller dimension.
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  const out = Math.min(side, maxSize);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Subtle quality bump — disable smoothing only if downsizing under 2×.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);

  const dataUrl = canvas.toDataURL(mime, quality);
  if (dataUrl.length > AVATAR_MAX_BYTES) {
    // If we still overshot, retry with smaller maxSize once.
    if (out > 128) {
      return compressImageFile(file, { ...options, maxSize: 128 });
    }
    throw new Error('Image is still too large after compression');
  }
  return dataUrl;
}

/** Whether a string looks like an external image URL we can render. */
export function isUsableImageUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('data:image/');
}
