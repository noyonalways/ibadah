import type { Document, Model } from 'mongoose';

/**
 * Settings for the temporary "About this project" pop-up shown to
 * first-time visitors (mostly recruiters) on the public landing page.
 *
 * Operators edit these from Admin → Settings. When `enabled` is
 * false the client never renders the pop-up or its floating launcher.
 * Empty strings mean "not set", and the client hides that row/link.
 */
export interface IRecruiterIntroConfig {
  enabled: boolean;
  /** Shown as "Built by …" in the pop-up header. */
  authorName: string;
  githubUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  /** Shared demo account. Visible to the public whenever the pop-up is on. */
  demoEmail: string;
  demoPassword: string;
}

/**
 * Site-wide runtime settings as a singleton keyed by `key: 'global'`.
 * Each feature gets its own sub-document, so future toggles can live
 * here without another collection.
 */
export interface ISiteConfig {
  key: 'global';
  recruiterIntro: IRecruiterIntroConfig;
  updatedBy?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface ISiteConfigDocument extends ISiteConfig, Document {}
export type ISiteConfigModel = Model<ISiteConfigDocument>;

/** Public, unauthenticated projection. Disabled = no other fields leak. */
export type PublicRecruiterIntro =
  | { enabled: false }
  | ({ enabled: true } & Omit<IRecruiterIntroConfig, 'enabled'>);

export interface PublicSiteConfig {
  recruiterIntro: PublicRecruiterIntro;
}
