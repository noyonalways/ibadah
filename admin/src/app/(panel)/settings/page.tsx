'use client';

/**
 * Operator profile + admin-panel preferences. Fully translated via
 * next-intl: changing the locale here flips the entire panel into the
 * new language as soon as the save mutation succeeds, because the
 * I18nProvider subscribes to the auth store.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Camera, Loader2, LocateFixed, Save, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { profileApi } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  AVATAR_MAX_BYTES,
  compressImageFile,
  isUsableImageUrl,
} from '@/lib/avatar-utils';
import { detectTimezone, groupedTimezones } from '@/lib/timezones';

type Locale = 'en' | 'bn' | 'ar';

const LOCALES: { value: Locale; labelKey: 'localeEn' | 'localeBn' | 'localeAr'; hintKey: 'localeHintEn' | 'localeHintBn' | 'localeHintAr' }[] = [
  { value: 'en', labelKey: 'localeEn', hintKey: 'localeHintEn' },
  { value: 'bn', labelKey: 'localeBn', hintKey: 'localeHintBn' },
  { value: 'ar', labelKey: 'localeAr', hintKey: 'localeHintAr' },
];

const FORM_FIELD_CLS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

interface FormState {
  name: string;
  avatarUrl: string;
  locale: Locale;
  timezone: string;
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

  useEffect(() => {
    if (profile.data) {
      setForm({
        name: profile.data.name,
        avatarUrl: profile.data.avatarUrl ?? '',
        locale: profile.data.locale,
        timezone: profile.data.timezone,
      });
    }
  }, [profile.data]);

  const timezones = useMemo(() => groupedTimezones(), []);

  const save = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: form.name.trim() || undefined,
        avatarUrl: form.avatarUrl,
        locale: form.locale,
        timezone: form.timezone,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      // Mirror into the auth store so the I18nProvider sees the new
      // locale and the entire panel re-renders in that language.
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
      toast.success(t('profileSaved'));
    },
    onError: (e) =>
      toast.error(e instanceof ApiClientError ? e.message : t('saveFailed')),
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
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
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
            {t('profileHint')}
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
                aria-label={t('uploadAvatar')}
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
              <Label htmlFor="avatar-url">{t('avatar')}</Label>
              <Input
                id="avatar-url"
                value={form.avatarUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avatarUrl: e.target.value }))
                }
                placeholder={t('avatarPlaceholder')}
                disabled={save.isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('avatarHint')}
              </p>
            </div>

            {form.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
                disabled={save.isPending}
                className="self-start text-muted-foreground hover:text-destructive sm:self-center"
              >
                <Trash2 className="size-4" />
                <span className="ml-1 hidden sm:inline">{tCommon('remove')}</span>
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
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" value={profile.data?.email ?? ''} disabled />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="locale">{t('locale')}</Label>
              <select
                id="locale"
                value={form.locale}
                onChange={(e) =>
                  setForm((f) => ({ ...f, locale: e.target.value as Locale }))
                }
                disabled={save.isPending || isLoading}
                className={FORM_FIELD_CLS}
              >
                {LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {t(l.labelKey)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {t(LOCALES.find((l) => l.value === form.locale)?.hintKey ?? 'localeHintEn')}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="timezone">{t('timezone')}</Label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, timezone: detectTimezone() }))
                  }
                  disabled={save.isPending || isLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <LocateFixed className="size-3" />
                  {tCommon('detect')}
                </button>
              </div>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                disabled={save.isPending || isLoading}
                className={FORM_FIELD_CLS}
              >
                {!timezones.some((g) =>
                  g.zones.some((z) => z.value === form.timezone),
                ) && (
                  <option value={form.timezone}>{form.timezone}</option>
                )}
                {timezones.map((g) => (
                  <optgroup key={g.region} label={g.region}>
                    {g.zones.map((z) => (
                      <option key={z.value} value={z.value}>
                        {z.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {t('timezoneHint')}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-end gap-2 pt-2 sm:flex-row sm:items-center">
            {save.isPending && (
              <span className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:mr-2">
                <Loader2 className="size-3.5 animate-spin" /> {tCommon('saving')}
              </span>
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
            <Row label={t('userId')} value={profile.data?.id ?? '—'} mono />
            <Row label={t('created')} value={profile.data?.createdAt ?? '—'} />
            <Row label={t('signInMethods')} value={signInMethods(profile.data)} />
            <Row
              label={t('adminRole')}
              value={profile.data?.isAdmin ? t('adminYes') : t('adminNo')}
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
