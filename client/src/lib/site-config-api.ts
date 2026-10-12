import { api } from './api';

export interface PublicRecruiterIntro {
  enabled: boolean;
  authorName?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  demoEmail?: string;
  demoPassword?: string;
}

export interface PublicSiteConfig {
  recruiterIntro: PublicRecruiterIntro;
}

export const siteConfigApi = {
  getPublic: async (): Promise<PublicSiteConfig> => {
    return api<PublicSiteConfig>('/site-config/public');
  },
};
