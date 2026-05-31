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
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // Wait until zustand has finished reading localStorage before letting
  // React Query fire — otherwise auth-aware screens flash a "logged out"
  // state for a single tick on every navigation.
  const enabled = hasHydrated && !!authStorage.getAccess();

  const query = useQuery<AuthUser | null>({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled,
    staleTime: 60_000,
    // Network/server errors must NOT wipe the cached session — the user
    // still has a valid token, the server just isn't reachable.
    retry: (failureCount, _err) => failureCount < 2,
  });

  // Mirror successful query results back into zustand so any consumer
  // that subscribes only to the store stays in sync.
  useEffect(() => {
    if (query.data !== undefined) setUser(query.data);
  }, [query.data, setUser]);

  return {
    // Prefer fresh server data, fall back to the persisted snapshot.
    user: query.data ?? cachedUser,
    // While we're still hydrating localStorage, treat "loading" as true
    // so guards don't bounce to /login.
    isLoading: !hasHydrated || query.isLoading,
    isError: query.isError,
    /** True after the persisted store has been read from localStorage. */
    hasHydrated,
  };
}

function useAuthMutationHelpers() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const sync = (user: AuthUser) => {
    setUser(user);
    qc.setQueryData(ME_KEY, user);
  };
  return { sync };
}

export function useLogin() {
  const { sync } = useAuthMutationHelpers();
  return useMutation({ mutationFn: authApi.login, onSuccess: sync });
}

export function useRegister() {
  const { sync } = useAuthMutationHelpers();
  return useMutation({ mutationFn: authApi.register, onSuccess: sync });
}

export function useGoogleExchange() {
  const { sync } = useAuthMutationHelpers();
  return useMutation({ mutationFn: authApi.exchangeGoogleCode, onSuccess: sync });
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
