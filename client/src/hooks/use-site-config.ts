'use client';

import { useQuery } from '@tanstack/react-query';
import { siteConfigApi, type PublicSiteConfig } from '@/lib/site-config-api';

export const PUBLIC_SITE_CONFIG_KEY = ['site-config', 'public'] as const;

export function usePublicSiteConfig() {
  return useQuery<PublicSiteConfig>({
    queryKey: PUBLIC_SITE_CONFIG_KEY,
    queryFn: () => siteConfigApi.getPublic(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
