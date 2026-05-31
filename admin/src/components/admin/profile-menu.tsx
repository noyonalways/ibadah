'use client';

/**
 * Header dropdown that surfaces inline editing of the admin's identity:
 * avatar, display name, default locale, and timezone.
 *
 * Edits hit `PATCH /users/me` (already validated server-side) and the
 * resulting profile is written back into TanStack Query so anywhere that
 * reads `useCurrentAdmin()` updates instantly. The locale change also
 * triggers a re-render of the entire i18n tree via the auth store.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Camera,
  Loader2,
  LogOut,
  Save,
  Settings,
  X,
  type LucideIcon,
  ChevronDown,
} from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import { profileApi } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { useCurrentAdmin, useLogout } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import {
  AVATAR_MAX_BYTES,
  compressImageFile,
} from '@/lib/avatar-utils';
import { groupedTimezones } from '@/lib/timezones';
import Link from 'next/link';

const LOCALES: { value: 'en' | 'bn' | 'ar'; labelKey: 'localeEn' | 'localeBn' | 'localeAr' }[] = [
  { value: 'en', labelKey: 'localeEn' },
  { value: 'bn', labelKey: 'localeBn' },
  { value: 'ar', labelKey: 'localeAr' },
];

export function ProfileMenu() {
  const router = useRouter();
  const t = useTranslations('ProfileMenu');
  const tSettings = useTranslations('Settings');
  const { user } = useCurrentAdmin();
  const logout = useLogout();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const profile = useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: profileApi.get,
    staleTime: 60_000,
  });

  const [name, setName] = useState('');
  const [locale, setLocale] = useState<'en' | 'bn' | 'ar'>('en');
  const [timezone, setTimezone] = useState('UTC');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name);
      setLocale(profile.data.locale);
      setTimezone(profile.data.timezone);
      setAvatarUrl(profile.data.avatarUrl);
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: name.trim() || undefined,
        avatarUrl: avatarUrl ?? '',
        locale,
        timezone,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      // Mirror into the auth store so the I18nProvider sees the new
      // locale immediately and re-renders the panel in the new language.
      setUser({
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
      toast.success(t('profileUpdated'));
    },
    onError: (e) =>
      toast.error(e instanceof ApiClientError ? e.message : t('couldNotSave')),
  });

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, { maxSize: 256, quality: 0.85 });
      if (dataUrl.length > AVATAR_MAX_BYTES) {
        throw new Error(t('imageTooLarge'));
      }
      setAvatarUrl(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('couldNotReadImage'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/login');
  };

  const dirty =
    profile.data &&
    (name !== profile.data.name ||
      locale !== profile.data.locale ||
      timezone !== profile.data.timezone ||
      (avatarUrl ?? '') !== (profile.data.avatarUrl ?? ''));

  const timezones = groupedTimezones();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-2 py-1 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={t('trigger')}
        >
          <Avatar
            src={user?.avatarUrl}
            name={user?.name}
            size={32}
            rounded="full"
          />
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span className="max-w-[140px] truncate">{user?.name ?? '—'}</span>
              <ChevronDown className="size-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </span>
            <span className="max-w-[160px] truncate text-[10px] text-muted-foreground">
              {user?.email}
            </span>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] max-w-[90vw] p-0"
      >
        <div className="flex items-start gap-3 border-b border-border/60 p-4">
          <div className="relative">
            <Avatar
              src={avatarUrl}
              name={name || user?.name}
              size={56}
              rounded="2xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
              aria-label={t('changeAvatar')}
              disabled={uploading || save.isPending}
            >
              {uploading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Camera className="size-3" />
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

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{user?.name}</span>
              {user?.isAdmin && (
                <Badge variant="success" className="text-[9px]">
                  {t('adminBadge')}
                </Badge>
              )}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email}
            </p>
            {avatarUrl && avatarUrl !== profile.data?.avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(undefined)}
                className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-destructive"
              >
                <X className="size-2.5" />
                {t('discardPicture')}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <Label htmlFor="pm-name" className="text-xs">
              {t('name')}
            </Label>
            <Input
              id="pm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              disabled={save.isPending}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pm-locale" className="text-xs">
                {t('locale')}
              </Label>
              <Select
                id="pm-locale"
                value={locale}
                onValueChange={(v) => setLocale(v as 'en' | 'bn' | 'ar')}
                disabled={save.isPending}
              >
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {tSettings(l.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pm-tz" className="text-xs">
                {t('timezone')}
              </Label>
              <Select
                id="pm-tz"
                value={timezone}
                onValueChange={setTimezone}
                disabled={save.isPending}
              >
                <SelectContent>
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
            </div>
          </div>

          <Button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending || uploading || !name.trim()}
            className="w-full gap-1.5"
          >
            {save.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {t('saveProfile')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1 border-t border-border/60 p-2">
          <MenuButton
            href="/settings"
            icon={Settings}
            onSelect={() => setOpen(false)}
          >
            {t('fullSettings')}
          </MenuButton>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            {t('signOut')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MenuButton({
  href,
  icon: Icon,
  children,
  onSelect,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );
}
