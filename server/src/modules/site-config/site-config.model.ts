import { Schema, model } from 'mongoose';
import type {
  IRecruiterIntroConfig,
  ISiteConfigDocument,
  ISiteConfigModel,
} from '@/modules/site-config/site-config.interface';

const recruiterIntroSchema = new Schema<IRecruiterIntroConfig>(
  {
    enabled: { type: Boolean, default: true },
    authorName: { type: String, trim: true, maxlength: 80, default: 'Noyon' },
    githubUrl: { type: String, trim: true, maxlength: 300, default: 'https://github.com/noyonalways/ibadah' },
    portfolioUrl: { type: String, trim: true, maxlength: 300, default: 'https://github.com/noyonalways' },
    linkedinUrl: { type: String, trim: true, maxlength: 300, default: 'https://linkedin.com/in/noyonalways' },
    demoEmail: { type: String, trim: true, lowercase: true, maxlength: 200, default: 'demo@ibadah.app' },
    demoPassword: { type: String, maxlength: 200, default: 'password123' },
  },
  { _id: false },
);

const siteConfigSchema = new Schema<ISiteConfigDocument, ISiteConfigModel>(
  {
    key: { type: String, default: 'global', unique: true, immutable: true },
    recruiterIntro: { type: recruiterIntroSchema, default: () => ({}) },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true, collection: 'site_config' },
);

export const SiteConfig = model<ISiteConfigDocument, ISiteConfigModel>(
  'Site_Config',
  siteConfigSchema,
);
