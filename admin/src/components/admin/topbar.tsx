'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useCurrentAdmin, useLogout } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

export function AdminTopbar() {
  const { user } = useCurrentAdmin();
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar src={user.avatarUrl} name={user.name} size={36} rounded="full" />
            <div className="flex flex-col leading-tight">
              <span className="flex items-center gap-2 text-sm font-medium">
                {user.name}
                {user.isAdmin && (
                  <Badge variant="success" className="text-[10px]">
                    admin
                  </Badge>
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </Button>
      </div>
    </header>
  );
}
