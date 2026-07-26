import type { Document, Model } from 'mongoose';

/** A single change entry within a release (maps to a conventional commit). */
export interface IReleaseEntry {
  category: 'feature' | 'fix' | 'enhancement';
  title: string;
  scope?: string;
}

/** A versioned release containing grouped change entries. */
export interface IRelease {
  version: string;
  date: Date;
  entries: IReleaseEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReleaseDocument extends IRelease, Document {}
export type IReleaseModel = Model<IReleaseDocument>;

/** Query params for GET /releases. */
export interface IReleaseQueryParams {
  page?: string;
  limit?: string;
}
