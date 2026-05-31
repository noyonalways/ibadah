'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shadcn-compatible Select shim backed by a native <select>.
 * Supports: onValueChange, <SelectGroup> → <optgroup>, <SelectItem> → <option>.
 * Trigger / Value / Content are no-ops — the native element handles rendering.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (React.isValidElement(node)) {
    return flattenText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

/** Recursively convert SelectItem / SelectGroup / SelectContent JSX → real <option>/<optgroup> */
function renderOptions(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return null;
    const type = child.type as { displayName?: string } | string;
    const name = typeof type === 'string' ? '' : (type.displayName ?? '');

    if (name === 'SelectItem') {
      const p = child.props as { value: string; children: React.ReactNode; disabled?: boolean };
      return (
        <option key={p.value} value={p.value} disabled={p.disabled}>
          {flattenText(p.children)}
        </option>
      );
    }

    if (name === 'SelectGroup') {
      const p = child.props as { label?: string; children?: React.ReactNode };
      return (
        <optgroup key={p.label} label={p.label}>
          {renderOptions(p.children)}
        </optgroup>
      );
    }

    // SelectContent or any other wrapper — recurse into children
    const p = child.props as { children?: React.ReactNode };
    return p.children ? renderOptions(p.children) : null;
  });
}

// ── Components ────────────────────────────────────────────────────────────────

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, defaultValue, onValueChange, onChange, children, className, ...rest }, ref) => (
    <select
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {renderOptions(children)}
    </select>
  ),
);
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

export function SelectGroup({
  children,
}: {
  label?: string;
  children?: React.ReactNode;
}) {
  // Rendered by renderOptions above; this component is only a JSX marker.
  return <>{children}</>;
}
SelectGroup.displayName = 'SelectGroup';

export function SelectItem(_: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return null;
}
SelectItem.displayName = 'SelectItem';
