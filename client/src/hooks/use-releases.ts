'use client';

import { useQuery } from '@tanstack/react-query';
import { releasesApi, type Release } from '@/lib/releases-api';

const RELEASES_KEY = ['releases'] as const;

export function useReleases(page = 1, limit = 50) {
  return useQuery<Release[]>({
    queryKey: [...RELEASES_KEY, page, limit],
    queryFn: () => releasesApi.list(page, limit),
    staleTime: 5 * 60_000, // 5 minutes — releases change infrequently
  });
}
