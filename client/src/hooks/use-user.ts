'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, type UserProfile } from '@/lib/user/user-api';
import { useAuthStore } from '@/store/auth-store';

const PROFILE_KEY = ['user', 'profile'] as const;

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: userApi.getMe,
    staleTime: 30_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_KEY, data);
      qc.setQueryData(['auth', 'me'], data);
      setUser(data);
    },
  });
}

export function useResetScoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.resetScoring,
    onSuccess: (data) => qc.setQueryData(PROFILE_KEY, data),
  });
}
