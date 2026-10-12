import { SiteConfig } from '@/modules/site-config/site-config.model';
import type {
  IRecruiterIntroConfig,
  PublicSiteConfig,
} from '@/modules/site-config/site-config.interface';

/**
 * Fallbacks for a fresh database (no admin has saved yet). The pop-up
 * starts ON by default as requested, prefilled with project and demo data.
 * Admins can disable or customize any field anytime via the Admin Settings page.
 */
export const FALLBACK_RECRUITER_INTRO: IRecruiterIntroConfig = {
  enabled: true,
  authorName: 'Noyon',
  githubUrl: 'https://github.com/noyonalways/ibadah',
  portfolioUrl: 'https://github.com/noyonalways',
  linkedinUrl: 'https://linkedin.com/in/noyonalways',
  demoEmail: 'demo@ibadah.app',
  demoPassword: 'password123',
};

export interface SiteConfigResult {
  recruiterIntro: IRecruiterIntroConfig;
  updatedBy?: string;
  updatedAt?: Date;
}

/**
 * Every landing-page visit hits the public endpoint, so the public
 * projection is cached briefly in memory. Admin writes clear the cache,
 * so a toggle shows up on the next request. A multi-instance deploy
 * can lag by at most this TTL.
 */
const PUBLIC_CACHE_TTL_MS = 15_000;
let publicCache: { value: PublicSiteConfig; at: number } | null = null;

function normalize(intro?: Partial<IRecruiterIntroConfig> | null): IRecruiterIntroConfig {
  if (!intro) return { ...FALLBACK_RECRUITER_INTRO };
  return {
    enabled: typeof intro.enabled === 'boolean' ? intro.enabled : FALLBACK_RECRUITER_INTRO.enabled,
    authorName: intro.authorName || FALLBACK_RECRUITER_INTRO.authorName,
    githubUrl: intro.githubUrl || FALLBACK_RECRUITER_INTRO.githubUrl,
    portfolioUrl: intro.portfolioUrl || FALLBACK_RECRUITER_INTRO.portfolioUrl,
    linkedinUrl: intro.linkedinUrl || FALLBACK_RECRUITER_INTRO.linkedinUrl,
    demoEmail: intro.demoEmail || FALLBACK_RECRUITER_INTRO.demoEmail,
    demoPassword: intro.demoPassword || FALLBACK_RECRUITER_INTRO.demoPassword,
  };
}

export const siteConfigService = {
  /** Full config, admin-only. */
  async get(): Promise<SiteConfigResult> {
    const doc = await SiteConfig.findOne({ key: 'global' }).lean();
    if (!doc) return { recruiterIntro: { ...FALLBACK_RECRUITER_INTRO } };
    return {
      recruiterIntro: normalize(doc.recruiterIntro),
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt,
    };
  },

  /** Public projection. When disabled, nothing but the flag is returned. */
  async getPublic(): Promise<PublicSiteConfig> {
    if (publicCache && Date.now() - publicCache.at < PUBLIC_CACHE_TTL_MS) {
      return publicCache.value;
    }
    const { recruiterIntro } = await this.get();
    const { enabled, ...rest } = recruiterIntro;
    const value: PublicSiteConfig = {
      recruiterIntro: enabled ? { enabled: true, ...rest } : { enabled: false },
    };
    publicCache = { value, at: Date.now() };
    return value;
  },

  /** Partial update of the recruiter-intro block. Unset keys are kept. */
  async updateRecruiterIntro(
    patch: Partial<IRecruiterIntroConfig>,
    updatedBy?: string,
  ): Promise<SiteConfigResult> {
    const current = await this.get();
    const next = normalize({ ...current.recruiterIntro, ...patch });

    const doc = await SiteConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: { recruiterIntro: next, updatedBy } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    publicCache = null;

    return {
      recruiterIntro: normalize(doc?.recruiterIntro),
      updatedBy: doc?.updatedBy,
      updatedAt: doc?.updatedAt,
    };
  },
};
