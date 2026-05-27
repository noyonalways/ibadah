'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldOff,
  Sparkles,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentAdmin } from '@/hooks/use-auth';
import { usersApi, type UserSummary } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';

const ROLES = [
  { value: 'all', label: 'All roles' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
] as const;

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
] as const;

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'lastActive', label: 'Last active' },
] as const;

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'user' | 'admin'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'lastActive'>('newest');
  const [page, setPage] = useState(1);

  // Debounce the search input so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ['admin', 'users', search, role, status, sort, page],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: role === 'all' ? undefined : role,
        status: status === 'all' ? undefined : status,
        sort,
        page,
        limit: 20,
      }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="Users"
        description="Search every account in the system. Use the row menu to suspend, promote, or delete a user. Administrators do not edit user-owned content from here."
      />

      {/* Filter bar */}
      <Card>
        <CardContent className="grid gap-3 p-5 lg:grid-cols-[1fr_180px_180px_200px]">
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or email…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as typeof role);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Sort by</Label>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as typeof sort);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Result list */}
      <Card>
        <div className="grid grid-cols-[minmax(0,3fr)_140px_140px_120px_56px] gap-3 border-b border-border/60 bg-muted/30 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Last active</span>
          <span className="text-right">·</span>
        </div>

        {list.isLoading && (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading users…
          </div>
        )}

        {list.data && list.data.items.length === 0 && (
          <div className="grid place-items-center px-6 py-14 text-center">
            <UsersIcon className="mb-3 size-8 text-muted-foreground/40" />
            <p className="font-medium">No users match these filters</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Clear the search or change the role/status filters above.
            </p>
          </div>
        )}

        {list.data && list.data.items.length > 0 && (
          <ul className="divide-y divide-border/50">
            {list.data.items.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </ul>
        )}

        {/* Pagination */}
        {list.data && list.data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3 text-xs">
            <span className="text-muted-foreground">
              Page <strong className="text-foreground tabular-nums">{list.data.meta.page}</strong>{' '}
              of <span className="tabular-nums">{list.data.meta.totalPages}</span> ·{' '}
              <span className="tabular-nums">{list.data.meta.total}</span> total
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (list.data.meta.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

function UserRow({ user }: { user: UserSummary }) {
  const qc = useQueryClient();
  const me = useCurrentAdmin();
  const isMe = me.user?.id === user.id;

  const update = useMutation({
    mutationFn: (body: Parameters<typeof usersApi.update>[1]) => usersApi.update(user.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Update failed'),
  });

  const remove = useMutation({
    mutationFn: () => usersApi.remove(user.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
      toast.success('User deleted');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Delete failed'),
  });

  return (
    <li className="grid grid-cols-[minmax(0,3fr)_140px_140px_120px_56px] items-center gap-3 px-5 py-3.5">
      <Link
        href={`/users/${user.id}`}
        className="flex min-w-0 items-center gap-3 hover:opacity-80"
      >
        <Avatar src={user.avatarUrl} name={user.name} size={40} />
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{user.name}</span>
            {isMe && (
              <Badge variant="outline" className="text-[9px]">
                you
              </Badge>
            )}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      </Link>

      <span className={cn('text-xs font-medium', user.role === 'admin' && 'text-primary')}>
        {user.role === 'admin' ? (
          <Badge variant="success">admin</Badge>
        ) : (
          <Badge variant="secondary">user</Badge>
        )}
      </span>

      <span>
        {user.suspended ? (
          <Badge variant="destructive">suspended</Badge>
        ) : (
          <Badge variant="outline">active</Badge>
        )}
      </span>

      <span className="text-right text-xs tabular-nums text-muted-foreground">
        {formatRelative(user.lastActiveAt)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={update.isPending || remove.isPending}
            aria-label="Row actions"
          >
            {update.isPending || remove.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.id}`} className="cursor-pointer">
              <UsersIcon className="size-4" />
              View detail
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.role === 'admin' ? (
            <DropdownMenuItem
              disabled={isMe}
              onSelect={() => update.mutate({ role: 'user' })}
            >
              <ShieldOff className="size-4" />
              Demote to user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => update.mutate({ role: 'admin' })}>
              <Sparkles className="size-4" />
              Promote to admin
            </DropdownMenuItem>
          )}
          {user.suspended ? (
            <DropdownMenuItem onSelect={() => update.mutate({ suspended: false })}>
              <PlayCircle className="size-4" />
              Unsuspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isMe}
              onSelect={() => update.mutate({ suspended: true })}
            >
              <PauseCircle className="size-4" />
              Suspend
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            disabled={isMe}
            onSelect={() => {
              const ok = confirm(
                `Permanently delete ${user.email}? This wipes all of their salah, quran, dhikr, habit and checklist data. This cannot be undone.`,
              );
              if (ok) remove.mutate();
            }}
          >
            <Trash2 className="size-4" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
