'use client';

import { ShieldCheck, AlertTriangle, ListChecks, ListTodo } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { RequiresAdminApi } from '@/components/admin/requires-admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ModerationPage() {
  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Content Moderation"
        description="Review user-generated content (custom habits, checklist items, dhikr labels) for inappropriate content."
        actions={
          <Badge variant="warning" className="gap-1.5">
            <AlertTriangle className="size-3" />
            Awaiting endpoints
          </Badge>
        }
      />

      <RequiresAdminApi
        title="Moderation queue not yet wired"
        description="Once the server exposes the routes below, this page will surface a queue of flagged or auto-detected items, with approve / hide / remove actions and full per-user attribution."
        endpoints={[
          { method: 'GET', path: '/admin/moderation/queue?type&status' },
          { method: 'POST', path: '/admin/moderation/:id/approve' },
          { method: 'POST', path: '/admin/moderation/:id/hide' },
          { method: 'DELETE', path: '/admin/moderation/:id', note: 'hard remove' },
          { method: 'GET', path: '/admin/habits?flag=', note: 'cross-user habits' },
          { method: 'GET', path: '/admin/checklist/items?flag=', note: 'cross-user items' },
        ]}
      />

      {/* Preview cards — what the queue will look like once data flows. */}
      <div className="grid gap-4 md:grid-cols-3">
        <PreviewCard
          icon={ListChecks}
          title="Habit definitions"
          description="User-named habits that may include profanity, spam, or PII."
          metricLabel="Pending"
          metricValue="—"
        />
        <PreviewCard
          icon={ListTodo}
          title="Checklist items"
          description="One-off daily entries with custom titles."
          metricLabel="Pending"
          metricValue="—"
        />
        <PreviewCard
          icon={ShieldCheck}
          title="Auto-detected"
          description="Server-side rules: length, repeated chars, link spam."
          metricLabel="Last 24h"
          metricValue="—"
        />
      </div>
    </>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  description,
  metricLabel,
  metricValue,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string | number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </div>
        <CardTitle className="mt-3 text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between border-t border-border/60 pt-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {metricLabel}
          </span>
          <span className="font-display text-2xl font-semibold tabular-nums text-foreground/60">
            {metricValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
