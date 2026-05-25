import type { Response } from 'express';

export interface ApiResponseShape<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export function sendResponse<T>(
  res: Response,
  payload: { statusCode: number; message: string; data: T; meta?: Record<string, unknown> },
): Response {
  const { statusCode, message, data, meta } = payload;
  const body: ApiResponseShape<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(body);
}
