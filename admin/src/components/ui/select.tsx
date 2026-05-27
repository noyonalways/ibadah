'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Compatibility shim for the shadcn `Select` API, backed by a native
 * `<select>` element. We avoid a Radix dependency for the admin's
 * small option lists, but expose the same call sites (`<Select>`,
 * `<SelectTrigger>`, `<SelectValue>`, `<SelectContent>`, `<SelectItem>`)
 * so pages don't have to know which implementation is wired up.
 *
 * Trigger/Value/Content render nothing — the native `<select>` does
 * its own rendering. We walk the JSX subtree once to collect the
 * `<SelectItem>` entries and emit real `<option>` nodes.
 */

interface ItemMeta {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

function flattenLabel(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenLabel).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return flattenLabel(props.children);
  }
  return '';
}

function collectItems(node: React.ReactNode, out: ItemMeta[]): void {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as { displayName?: string } | string;
    const displayName = typeof type === 'string' ? '' : type.displayName ?? '';

    if (displayName === 'SelectItem') {
      const props = child.props as {
        value: string;
        children: React.ReactNode;
        disabled?: boolean;
      };
      out.push({ value: props.value, label: props.children, disabled: props.disabled });
      return;
    }

    const props = child.props as { children?: React.ReactNode };
    if (props.children) collectItems(props.children, out);
  });
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  children,
  disabled,
  name,
  className,
}: SelectProps) {
  const items: ItemMeta[] = [];
  collectItems(children, items);

  return (
    <select
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {items.map((it) => (
        <option key={it.value} value={it.value} disabled={it.disabled}>
          {flattenLabel(it.label)}
        </option>
      ))}
    </select>
  );
}
Select.displayName = 'Select';

export function SelectTrigger(_: { children?: React.ReactNode; className?: string }) {
  return null;
}
SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue(_: { placeholder?: string; className?: string }) {
  return null;
}
SelectValue.displayName = 'SelectValue';

export function SelectContent({ children }: { children?: React.ReactNode; className?: string }) {
  return <>{children}</>;
}
SelectContent.displayName = 'SelectContent';

export function SelectItem(_: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return null;
}
SelectItem.displayName = 'SelectItem';
