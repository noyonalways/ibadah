'use client';

import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { RequiresAdminApi } from '@/components/admin/requires-admin-api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentAdmin } from '@/hooks/use-auth';

export default function UsersPage() {
  const { user } = useCurrentAdmin();

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Users"
        description="Search, inspect and act on every account in the system."
        actions={
          <Button disabled className="gap-1.5" title="Requires /admin/users endpoint">
            <Plus className="size-4" />
            Invite user
          </Button>
        }
      />

      {/* Search bar — disabled until the listing endpoint is available */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          className="pl-9"
          disabled
          aria-disabled
        />
      </div>

      <RequiresAdminApi
        title="Cross-user listing is not yet available"
        description="The server only exposes per-user routes today. Once the admin endpoints below ship, this page will render a paginated table with search, filters, status badges, and per-row actions."
        endpoints={[
          { method: 'GET', path: '/admin/users?search&page&limit', note: 'paginated list' },
          { method: 'GET', path: '/admin/users/:id', note: 'detail view' },
          { method: 'PATCH', path: '/admin/users/:id', note: 'update role / suspend / verify' },
          { method: 'DELETE', path: '/admin/users/:id', note: 'hard delete' },
          { method: 'GET', path: '/admin/users/:id/stats/daily?from&to' },
          { method: 'GET', path: '/admin/users/:id/streaks' },
        ]}
      />

      {/* Single-tenant fallback: the operator themselves */}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Single-tenant view
        </p>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar src={user?.avatarUrl} name={user?.name} size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{user?.name ?? '—'}</p>
                {user?.isAdmin && <Badge variant="success">admin</Badge>}
                {user?.hasGoogle && <Badge variant="outline">google</Badge>}
                {user?.hasPassword && <Badge variant="outline">password</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Locale {user?.locale} · Timezone {user?.timezone}
              </p>
            </div>
            <Badge variant="secondary">you</Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
