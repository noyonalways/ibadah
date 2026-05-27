'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/auth-api';
import { authStorage } from '@/lib/auth-storage';
import { useAuthStore, type AdminUser } from '@/store/auth-store';

const ME_KEY = ['admin', 'auth', 'me'] as const;

export function useCurrentAdmin() {
  const setUser = useAuthStore((s) => s.setUser);
  const cached = useAuthStore((s) => s.user);

  const query = useQuery<AdminUser | null>({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled: typeof window !== 'undefined' && !!authStorage.getAccess(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data !== undefined) setUser(query.data);
  }, [query.data, setUser]);

  return {
    user: query.data ?? cached,
    isLoading: query.isLoading,
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
