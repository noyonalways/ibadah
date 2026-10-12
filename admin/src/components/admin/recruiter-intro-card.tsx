'use client';

/**
 * Admin control for the temporary "About this project" pop-up on the
 * public landing page (aimed at recruiters).
 *
 * - The switch saves straight away, with no Save click. Turning it off
 *   hides the pop-up and its floating launcher for every visitor within
 *   seconds; the server caches the public read for about 15s.
 * - Links and demo credentials are a normal form with Save/Reset.
 *
 * Backed by `GET /admin/site-config` and
 * `PATCH /admin/site-config/recruiter-intro`.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Loader2, RotateCcw, Save } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Switch } from '@/components/ui/switch';
import {
  siteConfigApi,
  type RecruiterIntroConfig,
  type SiteConfigResult,
} from '@/lib/admin/admin-api';
import { ApiClientError } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

const QUERY_KEY = ['admin', 'site-config'] as const;

type Details = Omit<RecruiterIntroConfig, 'enabled'>;

const EMPTY: Details = {
  authorName: '',
  githubUrl: '',
  portfolioUrl: '',
  linkedinUrl: '',
  demoEmail: '',
  demoPassword: '',
};

function toDetails(c?: RecruiterIntroConfig): Details {
  if (!c) return EMPTY;
  const { enabled: _enabled, ...rest } = c;
  return rest;
}

const FIELDS: {
  key: keyof Details;
  label: string;
  placeholder: string;
  hint?: string;
  type?: 'url' | 'email' | 'password' | 'text';
}[] = [
  { key: 'authorName', label: 'Built by', placeholder: 'Your name', hint: 'Shown as "Built by …" in the header.' },
  { key: 'githubUrl', label: 'GitHub repository', placeholder: 'https://github.com/…', type: 'url' },
  { key: 'portfolioUrl', label: 'Portfolio', placeholder: 'https://…', type: 'url' },
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…', type: 'url' },
  {
    key: 'demoEmail',
    label: 'Demo account email',
    placeholder: 'demo@example.com',
    type: 'email',
    hint: 'Powers the one-click "Log in as demo" button.',
  },
  {
    key: 'demoPassword',
    label: 'Demo account password',
    placeholder: '••••••••',
    type: 'password',
    hint: 'Visible to anyone while the pop-up is on. Use a throwaway account.',
  },
];

export function RecruiterIntroCard() {
  const qc = useQueryClient();
  const config = useQuery({ queryKey: QUERY_KEY, queryFn: siteConfigApi.get });
  const intro = config.data?.recruiterIntro;

  const [form, setForm] = useState<Details>(EMPTY);
  useEffect(() => {
    if (intro) setForm(toDetails(intro));
  }, [intro]);

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => siteConfigApi.updateRecruiterIntro({ enabled }),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<SiteConfigResult>(QUERY_KEY);
      if (prev) {
        qc.setQueryData<SiteConfigResult>(QUERY_KEY, {
          ...prev,
          recruiterIntro: { ...prev.recruiterIntro, enabled },
        });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
      toast.error(e instanceof ApiClientError ? e.message : 'Could not update');
    },
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
      toast.success(
        data.recruiterIntro.enabled
          ? 'Recruiter pop-up is now live on the landing page'
          : 'Recruiter pop-up turned off',
      );
    },
  });

  const save = useMutation({
    mutationFn: () => siteConfigApi.updateRecruiterIntro(form),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
      toast.success('Recruiter pop-up details saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  const saved = toDetails(intro);
  const dirty = !!intro && (Object.keys(EMPTY) as (keyof Details)[]).some((k) => form[k] !== saved[k]);
  const enabled = !!intro?.enabled;
  const busy = config.isLoading || save.isPending;

  return (
    <Card id="recruiter-intro">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Recruiter pop-up</CardTitle>
                {intro && (
                  <Badge variant={enabled ? 'success' : 'secondary'}>
                    {enabled ? 'Live' : 'Off'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 max-w-prose text-xs text-muted-foreground">
                A temporary pop-up on the public landing page that explains what Ibadah is,
                the tech stack, and the architecture. It opens once per browser for new
                visitors, and a floating &quot;About this project&quot; button lets them reopen
                it. Add <code className="rounded bg-muted px-1">?intro=1</code> to the landing
                URL to force it open, for example when you send someone the link.
              </p>
            </div>
          </div>

          <label
            htmlFor="recruiter-intro-enabled"
            className="flex shrink-0 cursor-pointer items-center gap-3 self-start rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
          >
            <span className="text-sm font-medium">
              {toggle.isPending ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : enabled ? (
                'Enabled'
              ) : (
                'Disabled'
              )}
            </span>
            <Switch
              id="recruiter-intro-enabled"
              checked={enabled}
              disabled={!intro || toggle.isPending}
              onCheckedChange={(v) => toggle.mutate(v)}
              aria-label="Show recruiter pop-up on the landing page"
            />
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {config.isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Could not load site config. Is the server running the latest build?
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`ri-${f.key}`}>{f.label}</Label>
              {f.type === 'password' ? (
                <PasswordInput
                  id={`ri-${f.key}`}
                  value={form[f.key]}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  autoComplete="new-password"
                  disabled={busy}
                />
              ) : (
                <Input
                  id={`ri-${f.key}`}
                  type={f.type ?? 'text'}
                  value={form[f.key]}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  disabled={busy}
                />
              )}
              {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-stretch justify-between gap-2 pt-2 sm:flex-row sm:items-center">
          <p className="text-[11px] text-muted-foreground">
            {config.data?.updatedAt
              ? `Last updated ${formatRelative(config.data.updatedAt)}`
              : 'Not saved yet. The defaults are in use.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {dirty && !save.isPending && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm(saved)}
                className="gap-1.5"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            )}
            <Button
              onClick={() => save.mutate()}
              disabled={!dirty || busy}
              className="gap-1.5"
            >
              {save.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
