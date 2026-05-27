'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  HandHeart,
  Info,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  defaultsApi,
  type ChecklistDefault,
  type DefaultsResult,
  type DhikrDefault,
  type HabitDefault,
} from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { cn } from '@/lib/utils';

type DefaultsDraft = Pick<DefaultsResult, 'habits' | 'checklist' | 'dhikr'>;

const EMPTY: DefaultsDraft = { habits: [], checklist: [], dhikr: [] };

export default function DefaultsPage() {
  const qc = useQueryClient();
  const remote = useQuery({ queryKey: ['admin', 'defaults'], queryFn: defaultsApi.get });
  const [draft, setDraft] = useState<DefaultsDraft>(EMPTY);

  // Hydrate the draft from the server payload, but leave it untouched
  // once the user starts editing.
  useEffect(() => {
    if (remote.data) {
      setDraft({
        habits: remote.data.habits,
        checklist: remote.data.checklist,
        dhikr: remote.data.dhikr,
      });
    }
  }, [remote.data]);

  const dirty = useMemo(() => {
    if (!remote.data) return false;
    return JSON.stringify(draft) !== JSON.stringify({
      habits: remote.data.habits,
      checklist: remote.data.checklist,
      dhikr: remote.data.dhikr,
    });
  }, [draft, remote.data]);

  const save = useMutation({
    mutationFn: () => defaultsApi.update(draft),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'defaults'], data);
      toast.success('Defaults saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="Default templates"
        description="Starter habits, checklist items and dhikr presets that are seeded into every new user's account at signup. Existing users are not affected."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => remote.data && setDraft({
                habits: remote.data.habits,
                checklist: remote.data.checklist,
                dhikr: remote.data.dhikr,
              })}
              disabled={!dirty || save.isPending}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate()}
              className="gap-1.5"
            >
              {save.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save defaults
            </Button>
          </div>
        }
      />

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Info className="size-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium">These are <em>seeds</em>, not constraints.</p>
            <p className="mt-1 text-muted-foreground">
              When a new user signs up, they get a copy of these templates as a starting point.
              They can immediately add, edit or delete any of these in their own dashboard. The
              admin never modifies a user&apos;s customised content.
            </p>
          </div>
        </CardContent>
      </Card>

      {remote.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading defaults…
        </div>
      ) : (
        <Tabs defaultValue="habits">
          <TabsList>
            <TabsTrigger value="habits" className="gap-1.5">
              <HandHeart className="size-3.5" />
              Habits ({draft.habits.length})
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <Sparkles className="size-3.5" />
              Checklist ({draft.checklist.length})
            </TabsTrigger>
            <TabsTrigger value="dhikr" className="gap-1.5">
              <Sparkles className="size-3.5" />
              Dhikr ({draft.dhikr.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits">
            <HabitsEditor
              items={draft.habits}
              onChange={(items) => setDraft((d) => ({ ...d, habits: items }))}
            />
          </TabsContent>
          <TabsContent value="checklist">
            <ChecklistEditor
              items={draft.checklist}
              onChange={(items) => setDraft((d) => ({ ...d, checklist: items }))}
            />
          </TabsContent>
          <TabsContent value="dhikr">
            <DhikrEditor
              items={draft.dhikr}
              onChange={(items) => setDraft((d) => ({ ...d, dhikr: items }))}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

/* ---------------------------- Editors ---------------------------- */

function ListShell({
  emptyText,
  onAdd,
  children,
}: {
  emptyText: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">Edit list</CardTitle>
        <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5">
          <Plus className="size-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {children}
        {/* Default empty state hint, surfaced from caller */}
        <span className="sr-only">{emptyText}</span>
      </CardContent>
    </Card>
  );
}

function ItemRow({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-card p-3">
      <div className="grid flex-1 gap-2">{children}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Remove"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function HabitsEditor({
  items,
  onChange,
}: {
  items: HabitDefault[];
  onChange: (next: HabitDefault[]) => void;
}) {
  const add = () =>
    onChange([...items, { name: '', description: '', rewardPoints: 5 }]);
  const set = (i: number, patch: Partial<HabitDefault>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <ListShell emptyText="No habit defaults" onAdd={add}>
      {items.length === 0 ? (
        <Empty
          title="No habit defaults"
          description="Add starter habits — every new user will get a copy at signup."
          onAdd={add}
        />
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <ItemRow key={i} onRemove={() => onChange(items.filter((_, idx) => idx !== i))}>
              <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                <div className="space-y-1.5">
                  <Label htmlFor={`hd-name-${i}`} className="text-xs">
                    Name
                  </Label>
                  <Input
                    id={`hd-name-${i}`}
                    value={it.name}
                    onChange={(e) => set(i, { name: e.target.value })}
                    placeholder="e.g. Wake before Fajr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`hd-pts-${i}`} className="text-xs">
                    Reward
                  </Label>
                  <Input
                    id={`hd-pts-${i}`}
                    type="number"
                    min={-100}
                    max={100}
                    value={it.rewardPoints}
                    onChange={(e) =>
                      set(i, { rewardPoints: Number(e.target.value) || 0 })
                    }
                    className="tabular-nums"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`hd-desc-${i}`} className="text-xs">
                  Description (optional)
                </Label>
                <Input
                  id={`hd-desc-${i}`}
                  value={it.description ?? ''}
                  onChange={(e) => set(i, { description: e.target.value })}
                  placeholder="A short note shown to new users"
                />
              </div>
            </ItemRow>
          ))}
        </div>
      )}
    </ListShell>
  );
}

function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistDefault[];
  onChange: (next: ChecklistDefault[]) => void;
}) {
  const add = () => onChange([...items, { title: '', rewardPoints: 5 }]);
  const set = (i: number, patch: Partial<ChecklistDefault>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <ListShell emptyText="No checklist defaults" onAdd={add}>
      {items.length === 0 ? (
        <Empty
          title="No checklist defaults"
          description="Add starter checklist items — every new user will get a copy."
          onAdd={add}
        />
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <ItemRow key={i} onRemove={() => onChange(items.filter((_, idx) => idx !== i))}>
              <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <div className="space-y-1.5">
                  <Label htmlFor={`cd-title-${i}`} className="text-xs">
                    Title
                  </Label>
                  <Input
                    id={`cd-title-${i}`}
                    value={it.title}
                    onChange={(e) => set(i, { title: e.target.value })}
                    placeholder="e.g. Morning adhkar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`cd-pts-${i}`} className="text-xs">
                    Reward
                  </Label>
                  <Input
                    id={`cd-pts-${i}`}
                    type="number"
                    min={-100}
                    max={100}
                    value={it.rewardPoints}
                    onChange={(e) =>
                      set(i, { rewardPoints: Number(e.target.value) || 0 })
                    }
                    className="tabular-nums"
                  />
                </div>
              </div>
            </ItemRow>
          ))}
        </div>
      )}
    </ListShell>
  );
}

function DhikrEditor({
  items,
  onChange,
}: {
  items: DhikrDefault[];
  onChange: (next: DhikrDefault[]) => void;
}) {
  const add = () =>
    onChange([
      ...items,
      { slug: `dhikr-${items.length + 1}`, label: '', arabic: '', defaultTarget: 33 },
    ]);
  const set = (i: number, patch: Partial<DhikrDefault>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <ListShell emptyText="No dhikr defaults" onAdd={add}>
      {items.length === 0 ? (
        <Empty
          title="No dhikr defaults"
          description="Add starter dhikr presets — they'll appear when a new user opens their dhikr page."
          onAdd={add}
        />
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <ItemRow key={i} onRemove={() => onChange(items.filter((_, idx) => idx !== i))}>
              <div className="grid gap-2 sm:grid-cols-[140px_1fr_120px]">
                <div className="space-y-1.5">
                  <Label htmlFor={`dd-slug-${i}`} className="text-xs">
                    Slug
                  </Label>
                  <Input
                    id={`dd-slug-${i}`}
                    value={it.slug}
                    onChange={(e) =>
                      set(i, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                    }
                    placeholder="alhamdulillah"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`dd-label-${i}`} className="text-xs">
                    Label
                  </Label>
                  <Input
                    id={`dd-label-${i}`}
                    value={it.label}
                    onChange={(e) => set(i, { label: e.target.value })}
                    placeholder="Alhamdulillah"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`dd-target-${i}`} className="text-xs">
                    Target
                  </Label>
                  <Input
                    id={`dd-target-${i}`}
                    type="number"
                    min={1}
                    max={10000}
                    value={it.defaultTarget}
                    onChange={(e) =>
                      set(i, { defaultTarget: Number(e.target.value) || 0 })
                    }
                    className="tabular-nums"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`dd-ar-${i}`} className="text-xs">
                  Arabic (optional)
                </Label>
                <Input
                  id={`dd-ar-${i}`}
                  dir="rtl"
                  lang="ar"
                  value={it.arabic ?? ''}
                  onChange={(e) => set(i, { arabic: e.target.value })}
                  placeholder="ٱلْحَمْدُ لِلَّٰهِ"
                  className={cn('font-display')}
                />
              </div>
            </ItemRow>
          ))}
        </div>
      )}
    </ListShell>
  );
}

function Empty({
  title,
  description,
  onAdd,
}: {
  title: string;
  description: string;
  onAdd: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
      <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={onAdd}>
        <Plus className="size-3.5" />
        Add first item
      </Button>
    </div>
  );
}
