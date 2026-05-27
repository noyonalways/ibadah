import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../modules/user/user.interface.js';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

type IssuePayload = Omit<JwtPayload, 'type'>;

export function signAccessToken(payload: IssuePayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: IssuePayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
