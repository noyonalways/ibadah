'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { profileApi } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

export default function SettingsPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['admin', 'profile'], queryFn: profileApi.get });

  const [form, setForm] = useState({
    name: '',
    avatarUrl: '',
    locale: 'en' as 'en' | 'bn' | 'ar',
    timezone: 'UTC',
  });

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

  const save = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: form.name,
        avatarUrl: form.avatarUrl || undefined,
        locale: form.locale,
        timezone: form.timezone,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      toast.success('Profile saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Operator profile and admin-panel preferences."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            These values come from <code className="rounded bg-muted px-1">/users/me</code>{' '}
            on the server.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={form.avatarUrl} name={form.name} size={64} rounded="2xl" />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="avatar-url">Avatar URL</Label>
              <Input
                id="avatar-url"
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="https://… or data:image/…"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.data?.email ?? ''} disabled />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="locale">Default locale</Label>
              <Select
                id="locale"
                value={form.locale}
                onChange={(e) =>
                  setForm((f) => ({ ...f, locale: e.target.value as 'en' | 'bn' | 'ar' }))
                }
              >
                <option value="en">English</option>
                <option value="bn">Bangla (বাংলা)</option>
                <option value="ar">Arabic (العربية)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder="e.g. Asia/Dhaka, UTC, America/New_York"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {save.isPending && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </span>
            )}
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5">
              <Save className="size-4" />
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="User ID" value={profile.data?.id ?? '—'} mono />
            <Row label="Created" value={profile.data?.createdAt ?? '—'} />
            <Row label="Sign-in methods" value={signInMethods(profile.data)} />
            <Row label="Admin role" value={profile.data?.isAdmin ? 'yes' : 'no (single-tenant)'} />
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg border border-border/60 bg-card p-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-xs' : 'text-sm font-medium'}>{value}</dd>
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
