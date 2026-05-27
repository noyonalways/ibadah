import type { Document, Model } from 'mongoose';

/**
 * Admin-managed starter templates. These are *seeds* applied to new
 * users at signup — they are NOT enforced. Once a user signs up, they
 * own their own data and can add/edit/delete anything they like; the
 * admin can change the defaults later without retroactively affecting
 * existing users.
 */
export interface IHabitDefault {
  name: string;
  description?: string;
  rewardPoints: number;
  color?: string;
  icon?: string;
}

export interface IChecklistDefault {
  title: string;
  rewardPoints: number;
}

export interface IDhikrDefault {
  slug: string;
  label: string;
  arabic?: string;
  defaultTarget: number;
}

/** A single global record (singleton) keyed by `key: 'global'`. */
export interface IDefaultsConfig {
  key: 'global';
  habits: IHabitDefault[];
  checklist: IChecklistDefault[];
  dhikr: IDhikrDefault[];
  updatedBy?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface IDefaultsConfigDocument extends IDefaultsConfig, Document {}
export type IDefaultsConfigModel = Model<IDefaultsConfigDocument>;
