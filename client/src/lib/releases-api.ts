import { api } from './api';

export interface ReleaseEntry {
  category: 'feature' | 'fix' | 'enhancement';
  title: string;
  scope?: string;
}

export interface Release {
  _id: string;
  version: string;
  date: string;
  entries: ReleaseEntry[];
}

export interface ReleasesResponse {
  items: Release[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const releasesApi = {
  list: async (page = 1, limit = 20) => {
    const data = await api<Release[]>(`/releases?page=${page}&limit=${limit}`);
    return data;
  },
};
