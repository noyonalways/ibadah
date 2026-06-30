'use client';

/**
 * Operator profile + admin-panel preferences.
 *
 * The page is the canonical place to edit identity (name, avatar),
 * default locale, and timezone. Edits hit `PATCH /users/me` (the same
 * endpoint the header dropdown uses) and the result is mirrored into:
 *   - The TanStack Query cache for ['admin', 'profile']
 *   - The auth store, so the sidebar/topbar avatar + name re-render
 *     immediately without a round-trip.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Camera, Loader2, LocateFixed, RotateCcw, Save, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { profileApi, type Profile } from '@/lib/admin/admin-api';
import { ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  AVATAR_MAX_BYTES,
  compressImageFile,
  isUsableImageUrl,
} from '@/lib/avatar-utils';
import { detectTimezone, groupedTimezones } from '@/lib/timezones';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Locale = 'en' | 'bn' | 'ar';

const LOCALES: { value: Locale; label: string; hint: string }[] = [
  { value: 'en', label: 'English', hint: 'Default UI language for the operations console.' },
  { value: 'bn', label: 'বাংলা (Bangla)', hint: 'বাংলা — Bengali' },
  { value: 'ar', label: 'العربية (Arabic)', hint: 'العربية — right-to-left layout' },
];


interface FormState {
  name: string;
  avatarUrl: string;
  locale: Locale;
  timezone: string;
}

function profileToForm(p: Profile): FormState {
  return {
    name: p.name,
    avatarUrl: p.avatarUrl ?? '',
    locale: p.locale,
    timezone: p.timezone,
  };
}

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('Common');
  const qc = useQueryClient();
  const setStoreUser = useAuthStore((s) => s.setUser);

  const profile = useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: profileApi.get,
    staleTime: 60_000,
  });

  const [form, setForm] = useState<FormState>({
    name: '',
    avatarUrl: '',
    locale: 'en',
    timezone: 'UTC',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate the form from the server payload exactly once it arrives,
  // and again whenever the cached profile changes (e.g. after save).
  useEffect(() => {
    if (profile.data) setForm(profileToForm(profile.data));
  }, [profile.data]);

  const timezones = useMemo(() => groupedTimezones(), []);

  const save = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: form.name.trim() || undefined,
        // Empty string explicitly clears the avatar on the server.
        avatarUrl: form.avatarUrl,
        locale: form.locale,
        timezone: form.timezone,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      // Mirror into the auth store so the topbar avatar/name update
      // immediately. This is what makes the locale + timezone choice
      // visible across the rest of the panel without a refresh.
      setStoreUser({
        id: data.id,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        locale: data.locale,
        timezone: data.timezone,
        hasPassword: data.hasPassword,
        hasGoogle: data.hasGoogle,
        isAdmin: data.isAdmin,
        createdAt: data.createdAt,
      });
      toast.success('Profile saved');
    },
    onError: (e) =>
      toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, { maxSize: 256, quality: 0.85 });
      if (dataUrl.length > AVATAR_MAX_BYTES) {
        throw new Error('Image too large after compression');
      }
      setForm((f) => ({ ...f, avatarUrl: dataUrl }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read image');
    } finally {
      setUploading(false);
      // Reset the native picker so picking the same file twice still fires.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const dirty =
    profile.data &&
    (form.name !== profile.data.name ||
      form.locale !== profile.data.locale ||
      form.timezone !== profile.data.timezone ||
      (form.avatarUrl ?? '') !== (profile.data.avatarUrl ?? ''));

  const canSubmit =
    !!profile.data &&
    !!dirty &&
    !save.isPending &&
    !uploading &&
    form.name.trim().length > 0;

  const isLoading = profile.isLoading;

  const showAvatarPreview = isUsableImageUrl(form.avatarUrl) || !form.avatarUrl;

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('profile')}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            These values are stored on your account via{' '}
            <code className="rounded bg-muted px-1">/users/me</code>. Changes
            here also update the header dropdown instantly.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <Avatar
                src={showAvatarPreview ? form.avatarUrl : undefined}
                name={form.name}
                size={72}
                rounded="2xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || save.isPending}
                aria-label="Upload avatar"
                className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <Label htmlFor="avatar-url">Avatar URL or data</Label>
              <Input
                id="avatar-url"
                value={form.avatarUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avatarUrl: e.target.value }))
                }
                placeholder="https://… or paste an image data URL"
                disabled={save.isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                Pick a file with the camera button, paste an external URL, or
                clear to remove the picture.
              </p>
            </div>

            {form.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
                disabled={save.isPending}
                className="self-start sm:self-center text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
                <span className="ml-1 hidden sm:inline">Remove</span>
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                disabled={save.isPending || isLoading}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.data?.email ?? ''}
                disabled
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="locale">Default locale</Label>
              <Select
                value={form.locale}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, locale: v as Locale }))
                }
                disabled={save.isPending || isLoading}
              >
                <SelectTrigger id="locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {LOCALES.find((l) => l.value === form.locale)?.hint}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, timezone: detectTimezone() }))
                  }
                  disabled={save.isPending || isLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <LocateFixed className="size-3" />
                  Detect
                </button>
              </div>
              <Select
                value={form.timezone}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, timezone: v }))
                }
                disabled={save.isPending || isLoading}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {!timezones.some((g) =>
                    g.zones.some((z) => z.value === form.timezone),
                  ) && (
                    <SelectItem value={form.timezone}>{form.timezone}</SelectItem>
                  )}
                  {timezones.map((g) => (
                    <SelectGroup key={g.region} label={g.region}>
                      {g.zones.map((z) => (
                        <SelectItem key={z.value} value={z.value}>
                          {z.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Used for &quot;today&quot; boundaries in admin charts and reports.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-end gap-2 pt-2 sm:flex-row sm:items-center">
            {save.isPending && (
              <span className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:mr-2">
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </span>
            )}
            {dirty && !save.isPending && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  profile.data && setForm(profileToForm(profile.data))
                }
                className="gap-1.5"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            )}
            <Button
              onClick={() => save.mutate()}
              disabled={!canSubmit}
              className="gap-1.5"
            >
              <Save className="size-4" />
              {t('saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('accountInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="User ID" value={profile.data?.id ?? '—'} mono />
            <Row label="Created" value={profile.data?.createdAt ?? '—'} />
            <Row label="Sign-in methods" value={signInMethods(profile.data)} />
            <Row
              label="Admin role"
              value={profile.data?.isAdmin ? 'yes' : 'no (single-tenant)'}
            />
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg border border-border/60 bg-card p-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className={mono ? 'font-mono text-xs' : 'text-sm font-medium'}>
        {value}
      </dd>
    </div>
  );
}

function signInMethods(p?: { hasPassword: boolean; hasGoogle: boolean }): string {
  if (!p) return '—';
  const parts: string[] = [];
  if (p.hasPassword) parts.push('password');
  if (p.hasGoogle) parts.push('google');
  return parts.length ? parts.join(' + ') : 'none';
}
