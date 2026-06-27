import { Schema, model } from 'mongoose';
import type { IDefaultsConfigDocument, IDefaultsConfigModel } from '@/modules/admin/defaults.interface';

const habitDefaultSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    rewardPoints: { type: Number, default: 5, min: -100, max: 100 },
    color: { type: String, trim: true },
    icon: { type: String, trim: true },
  },
  { _id: false },
);

const checklistDefaultSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    rewardPoints: { type: Number, default: 5, min: -100, max: 100 },
  },
  { _id: false },
);

const dhikrDefaultSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    arabic: { type: String, trim: true, maxlength: 200 },
    defaultTarget: { type: Number, default: 33, min: 1, max: 10000 },
  },
  { _id: false },
);

const defaultsConfigSchema = new Schema<IDefaultsConfigDocument, IDefaultsConfigModel>(
  {
    key: { type: String, default: 'global', unique: true, immutable: true },
    habits: { type: [habitDefaultSchema], default: [] },
    checklist: { type: [checklistDefaultSchema], default: [] },
    dhikr: { type: [dhikrDefaultSchema], default: [] },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true, collection: 'defaults_config' },
);

export const DefaultsConfig = model<IDefaultsConfigDocument, IDefaultsConfigModel>(
  'Defaults_Config',
  defaultsConfigSchema,
);
