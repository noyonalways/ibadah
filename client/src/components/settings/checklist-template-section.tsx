'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateProfile } from '@/hooks/use-user';
import { ApiClientError } from '@/lib/api';
import { ListTodo } from 'lucide-react';
import type { ChecklistTemplateItem } from '@/lib/user-api';

interface DraftItem extends ChecklistTemplateItem {
  id: string;
}

export function ChecklistTemplateSection({
  initial,
}: {
  initial: ChecklistTemplateItem[];
}) {
  const t = useTranslations('Settings');
  const update = useUpdateProfile();
  const newInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(5);
  const [dirty, setDirty] = useState(false);

  // Hydrate / re-hydrate when the upstream profile data arrives.
  useEffect(() => {
    setItems(
      initial.map((it, i) => ({
        ...it,
        id: `existing-${i}-${it.title}`,
      })),
    );
    setDirty(false);
  }, [initial]);

  const updateItem = (id: string, patch: Partial<ChecklistTemplateItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setDirty(true);
  };

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return;
    if (items.length >= 50) {
      toast.error('Up to 50 template items');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        title,
        rewardPoints: newPoints,
      },
    ]);
    setNewTitle('');
    setNewPoints(5);
    setDirty(true);
    newInputRef.current?.focus();
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        defaultChecklistItems: items.map(({ id: _id, ...rest }) => rest),
      });
      toast.success(t('checklist_template_saved'));
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t('checklist_template_error'));
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-tertiary/15 text-tertiary">
            <ListTodo className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">{t('checklist_template_section')}</CardTitle>
            <CardDescription>{t('checklist_template_desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-xs text-muted-foreground">
            {t('checklist_template_empty')}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-2.5"
              >
                <input
                  value={it.title}
                  onChange={(e) => updateItem(it.id, { title: e.target.value })}
                  className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Item title"
                />
                <input
                  type="number"
                  value={it.rewardPoints}
                  onChange={(e) =>
                    updateItem(it.id, { rewardPoints: Number(e.target.value) || 0 })
                  }
                  className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-xs tabular-nums"
                  aria-label="Reward points"
                />
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  pts
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add row */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-dashed border-border">
            <Plus className="size-3.5 text-muted-foreground" />
          </span>
          <Input
            ref={newInputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder={t('checklist_template_placeholder')}
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <input
            type="number"
            value={newPoints}
            onChange={(e) => setNewPoints(Number(e.target.value) || 0)}
            className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-xs tabular-nums"
          />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            pts
          </span>
          <Button
            size="sm"
            className="rounded-full"
            onClick={addItem}
            disabled={!newTitle.trim()}
          >
            {/* using common.add but kept compact */}
            +
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={save}
            disabled={update.isPending || !dirty}
            className="rounded-full"
          >
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t('checklist_template_save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
