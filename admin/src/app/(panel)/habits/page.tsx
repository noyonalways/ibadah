'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { habitApi, type Habit } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

export default function HabitsAdminPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [points, setPoints] = useState(5);

  const habits = useQuery({ queryKey: ['admin', 'habits'], queryFn: habitApi.list });

  const create = useMutation({
    mutationFn: (body: Partial<Habit>) => habitApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'habits'] });
      setName('');
      setPoints(5);
      toast.success('Habit created');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Create failed'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => habitApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'habits'] });
      toast.success('Habit deleted');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Delete failed'),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Habit> }) =>
      habitApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'habits'] }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), rewardPoints: points });
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Habits"
        description="Manage habit definitions. Daily completions are aggregated into the dashboard."
      />

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>New habit</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="grid gap-3 sm:grid-cols-[1fr_140px_auto]"
          >
            <div className="space-y-1.5">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 5 minute morning walk"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="habit-points">Reward points</Label>
              <Input
                id="habit-points"
                type="number"
                min={-100}
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={!name.trim() || create.isPending}
                className="w-full gap-1.5 sm:w-auto"
              >
                {create.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Definitions</CardTitle>
          <Badge variant="outline">{habits.data?.length ?? 0}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {habits.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          )}

          {habits.data?.length === 0 && (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No habits yet. Create your first habit above.
            </p>
          )}

          {habits.data?.map((h) => (
            <div
              key={h._id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                {h.rewardPoints}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{h.name}</p>
                {h.description && (
                  <p className="truncate text-xs text-muted-foreground">{h.description}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Updated {formatRelative(h.updatedAt)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  update.mutate({ id: h._id, body: { archived: !h.archived } })
                }
                className="text-xs"
              >
                {h.archived ? 'Restore' : 'Archive'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete habit"
                onClick={() => {
                  if (confirm(`Delete habit "${h.name}"? This cannot be undone.`)) {
                    remove.mutate(h._id);
                  }
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
