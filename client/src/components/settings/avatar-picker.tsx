'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AVATAR_MAX_BYTES,
  compressImageFile,
  isUsableImageUrl,
} from '@/lib/avatar-utils';
import { AVATAR_PRESETS } from '@/lib/avatar-presets';
import { cn } from '@/lib/utils';

interface Props {
  /** Display name — used for fallback initials and image alt text. */
  name: string;
  /** Current avatar value. May be empty, a URL, or a data URL. */
  value: string;
  onChange: (next: string) => void;
  /** Persist the change to the backend. Called only on user-confirmed actions. */
  onSave: (next: string) => Promise<void> | void;
  disabled?: boolean;
}

/**
 * Avatar editor — three ways for the user to change their photo:
 *   1. Upload a file (resized + compressed in-browser to a small data URL)
 *   2. Paste a public image URL
 *   3. Pick from a gallery of preset Islamic-themed avatars
 *
 * Plus a "remove" affordance that clears the value back to initials. All
 * actions persist via `onSave` so the change survives a reload.
 */
export function AvatarPicker({ name, value, onChange, onSave, disabled }: Props) {
  const t = useTranslations('Settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'saving'>('idle');

  const showCustomBadge =
    isUsableImageUrl(value) &&
    !AVATAR_PRESETS.some((p) => p.dataUrl === value);

  const persist = async (next: string) => {
    setBusy('saving');
    try {
      await onSave(next);
      onChange(next);
    } catch (err) {
      // The parent's onSave is responsible for toasting on real failures;
      // we only swallow here because the state stays in sync via onChange.
      console.error(err);
    } finally {
      setBusy('idle');
    }
  };

  const onFile = async (file: File) => {
    setBusy('uploading');
    try {
      const dataUrl = await compressImageFile(file, { maxSize: 256, quality: 0.85 });
      await persist(dataUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('avatar_upload_error');
      toast.error(message);
      setBusy('idle');
    } finally {
      // Reset the file input so picking the same file twice fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onUseUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error(t('avatar_invalid_url'));
      return;
    }
    if (trimmed.length > AVATAR_MAX_BYTES) {
      toast.error(t('avatar_too_large'));
      return;
    }
    await persist(trimmed);
    setUrlInput('');
  };

  return (
    <div className="space-y-5">
      {/* Hero: large avatar + primary actions */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative">
          <Avatar src={value} name={name} size={96} rounded="2xl" />
          {busy !== 'idle' && (
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-background/60 backdrop-blur-sm">
              <Loader2 className="size-5 animate-spin text-foreground" />
            </span>
          )}
          {showCustomBadge && (
            <span
              className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-accent text-accent-foreground ring-2 ring-background"
              title={t('avatar_custom_badge')}
            >
              <Check className="size-3.5" />
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || busy !== 'idle'}
            >
              <Camera className="size-4" />
              {value ? t('avatar_change') : t('avatar_upload')}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => persist('')}
                disabled={disabled || busy !== 'idle'}
              >
                <Trash2 className="size-4" />
                {t('avatar_remove')}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('avatar_help')}</p>

          {/* URL paste row */}
          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="avatar-url" className="text-xs">
                {t('avatar_use_url_label')}
              </Label>
              <Input
                id="avatar-url"
                type="url"
                placeholder="https://…"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={disabled || busy !== 'idle'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onUseUrl();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onUseUrl}
              disabled={disabled || busy !== 'idle' || !urlInput.trim()}
              className="rounded-full"
            >
              {t('avatar_use_url_action')}
            </Button>
          </div>
        </div>
      </div>

      {/* Preset gallery */}
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t('avatar_presets')}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_PRESETS.map((preset) => {
            const active = value === preset.dataUrl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => persist(preset.dataUrl)}
                disabled={disabled || busy !== 'idle'}
                className={cn(
                  'group relative grid size-12 place-items-center overflow-hidden rounded-xl ring-1 ring-inset transition-all',
                  active
                    ? 'ring-2 ring-primary shadow-md shadow-primary/20'
                    : 'ring-border hover:ring-primary/40 hover:shadow-md hover:shadow-primary/10',
                )}
                aria-pressed={active}
                aria-label={preset.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.dataUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
                {active && (
                  <span className="absolute inset-0 grid place-items-center bg-primary/20">
                    <Check className="size-4 text-primary-foreground drop-shadow" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
