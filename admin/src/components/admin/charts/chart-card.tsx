'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Section wrapper used by every analytics chart. Provides the same
 * eyebrow + title + optional badge + actions layout consistently.
 */
export function ChartCard({
  title,
  description,
  badge,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          {actions}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ChartBadge({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" className="font-medium tabular-nums">
      {children}
    </Badge>
  );
}
