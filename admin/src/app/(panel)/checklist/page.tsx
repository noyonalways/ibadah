'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { checklistApi, type ChecklistItem } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { cn, toDayKey } from '@/lib/utils';

export default function ChecklistAdminPage() {
  const [date, setDate] = useState(toDayKey(new Date()));
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPoints, setDraftPoints] = useState(5);
  const qc = useQueryClient();

  const day = useQuery({
    queryKey: ['admin', 'checklist', date],
    queryFn: () => checklistApi.getDay(date),
  });

  useEffect(() => {
    if (day.data?.items) setItems(day.data.items);
  }, [day.data]);

  const save = useMutation({
    mutationFn: () => checklistApi.upsertDay(date, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'checklist', date] });
      toast.success('Saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  const total = items
    .filter((i) => i.completed)
    .reduce((s, i) => s + (i.rewardPoints ?? 0), 0);

  const addItem = () => {
    if (!draftTitle.trim()) return;
    setItems((arr) => [
      ...arr,
      { title: draftTitle.trim(), rewardPoints: draftPoints, completed: false },
    ]);
    setDraftTitle('');
    setDraftPoints(5);
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Checklist"
        description="Edit the daily checklist. Items contribute to the daily score when completed."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="cl-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="cl-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || toDayKey(new Date()))}
              className="w-[160px]"
            />
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{date}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.filter((i) => i.completed).length} of {items.length} done · {total} points
            </p>
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            size="sm"
            className="gap-1.5"
          >
            {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Add item form */}
          <div className="grid gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 sm:grid-cols-[1fr_120px_auto]">
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Add a new item…"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <Input
              type="number"
              value={draftPoints}
              onChange={(e) => setDraftPoints(Number(e.target.value) || 0)}
              min={-100}
              max={100}
              className="tabular-nums"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={!draftTitle.trim()}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> Add
            </Button>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No items for this day yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                    item.completed
                      ? 'border-primary/25 bg-primary/5'
                      : 'border-border/60 bg-card',
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setItems((arr) =>
                        arr.map((it, i) =>
                          i === idx ? { ...it, completed: !it.completed } : it,
                        ),
                      )
                    }
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                    className={cn(
                      'grid size-5 place-items-center rounded-full border-2 transition-colors',
                      item.completed
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/60',
                    )}
                  >
                    {item.completed && (
                      <svg viewBox="0 0 12 12" className="size-3" fill="none">
                        <path
                          d="M2 6.5L4.5 9L10 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  <Input
                    value={item.title}
                    onChange={(e) =>
                      setItems((arr) =>
                        arr.map((it, i) =>
                          i === idx ? { ...it, title: e.target.value } : it,
                        ),
                      )
                    }
                    className={cn(
                      'h-9 border-transparent bg-transparent shadow-none focus-visible:border-input focus-visible:bg-background',
                      item.completed && 'text-muted-foreground line-through',
                    )}
                  />

                  <Badge variant="outline" className="tabular-nums">
                    {item.rewardPoints}pt
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove item"
                    onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
