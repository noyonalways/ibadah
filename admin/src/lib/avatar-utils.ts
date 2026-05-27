/**
 * Browser-side avatar handling. Uploaded files are resized + compressed
 * to a small data URL so the existing `/users/me` PATCH route can store
 * them inline (avoiding the need for separate file-upload infrastructure).
 *
 * Mirrors `client/src/lib/avatar-utils.ts` so the two apps behave the
 * same way when an admin uploads a profile picture from either surface.
 */

export const AVATAR_MAX_BYTES = 600_000; // matches server validation

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = dataUrl;
  });
}

interface CompressOptions {
  maxSize?: number;
  quality?: number;
  mime?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Centered-square crop, downscale to `maxSize`, compress to `quality`.
 * Retries once at half-size if the result still exceeds the server limit.
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
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  const out = Math.min(side, maxSize);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);

  const dataUrl = canvas.toDataURL(mime, quality);
  if (dataUrl.length > AVATAR_MAX_BYTES) {
    if (out > 128) return compressImageFile(file, { ...options, maxSize: 128 });
    throw new Error('Image is still too large after compression');
  }
  return dataUrl;
}

export function isUsableImageUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('data:image/');
}
