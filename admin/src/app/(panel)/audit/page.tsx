'use client';

import { FileText, Filter } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { RequiresAdminApi } from '@/components/admin/requires-admin-api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AuditLogPage() {
  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Audit Log"
        description="Every privileged action: who did what, to whom, when, and from where."
      />

      <RequiresAdminApi
        title="Audit ledger requires server-side recording"
        description="The server does not currently emit an audit trail. The contract below records every privileged action keyed by actor + target + timestamp + reason."
        endpoints={[
          { method: 'GET', path: '/admin/audit?from&to&actor&action&limit&cursor' },
          { method: 'GET', path: '/admin/audit/:id' },
          { method: 'POST', path: '/admin/audit', note: 'internal — emitted by server middleware' },
        ]}
      >
        <p className="text-xs text-muted-foreground">
          Suggested actor schema:{' '}
          <code className="rounded bg-card px-1.5 py-0.5">
            {'{ id, email, name, ip, userAgent }'}
          </code>
        </p>
      </RequiresAdminApi>

      {/* Filter mockup — purely visual until the endpoint exists. */}
      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-[1fr_180px_180px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="audit-search" className="text-xs">
              Search
            </Label>
            <Input
              id="audit-search"
              disabled
              placeholder="Search by actor, target, or action…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-action" className="text-xs">
              Action
            </Label>
            <Select id="audit-action" disabled>
              <option>All actions</option>
              <option>user.update</option>
              <option>user.delete</option>
              <option>moderation.hide</option>
              <option>scoring.update</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-since" className="text-xs">
              Since
            </Label>
            <Input id="audit-since" type="date" disabled />
          </div>
          <div className="flex items-end">
            <button
              disabled
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-muted-foreground"
            >
              <Filter className="size-4" />
              Filter
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Empty placeholder table */}
      <Card>
        <div className="grid grid-cols-[120px_1fr_1fr_120px] gap-2 border-b border-border/60 bg-muted/30 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>When</span>
          <span>Actor</span>
          <span>Action</span>
          <span className="text-right">Target</span>
        </div>
        <div className="grid place-items-center px-6 py-14 text-center">
          <FileText className="mb-3 size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No audit events to display</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Once the server begins emitting audit events, every entry will land here in
            reverse-chronological order.
          </p>
          <Badge variant="outline" className="mt-3">
            0 events
          </Badge>
        </div>
      </Card>
    </>
  );
}
