'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/auth-api';
import { useAuthStore, type AuthUser } from '@/store/auth-store';
import { authStorage } from '@/lib/auth-storage';

const ME_KEY = ['auth', 'me'] as const;

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const cachedUser = useAuthStore((s) => s.user);

  const query = useQuery<AuthUser | null>({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled: !!authStorage.getAccess(),
    staleTime: 60_000,
  });

  // Keep zustand store in sync with the query result.
  useEffect(() => {
    if (query.data !== undefined) setUser(query.data);
  }, [query.data, setUser]);

  return {
    user: query.data ?? cachedUser,
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

export function useRegister() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.register,
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
