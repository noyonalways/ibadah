'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/auth/auth-api';
import { authStorage } from '@/lib/auth/auth-storage';
import { useAuthStore, type AdminUser } from '@/store/auth-store';

const ME_KEY = ['admin', 'auth', 'me'] as const;

export function useCurrentAdmin() {
  const setUser = useAuthStore((s) => s.setUser);
  const cached = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // Gate the query on hydration AND a stored access token. This avoids
  // flickering through a "logged-out" state on every navigation while
  // localStorage is being read, AND avoids hitting /auth/me when there
  // is nothing to send.
  const enabled =
    typeof window !== 'undefined' && hasHydrated && !!authStorage.getAccess();

  const query = useQuery<AdminUser | null>({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled,
    staleTime: 60_000,
    // The session survives transient errors. authApi.me() now throws on
    // network failures (instead of clearing the storage); React Query
    // retries once and then settles the query in error state, while the
    // cached user from zustand persist keeps the UI alive.
    retry: (failureCount, _err) => failureCount < 2,
  });

  useEffect(() => {
    if (query.data !== undefined) setUser(query.data);
  }, [query.data, setUser]);

  return {
    user: query.data ?? cached,
    isLoading: !hasHydrated || query.isLoading,
    isError: query.isError,
  };
}

export function useLogin() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const reset = useAuthStore((s) => s.reset);
  return () => {
    authApi.logout();
    reset();
    qc.removeQueries({ queryKey: ME_KEY });
    qc.clear();
  };
}
