import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@/utils/logger';

const SUSPICIOUS_PATH_PATTERNS: RegExp[] = [
  /\.(env|git|vscode|DS_Store|idea|aws|ssh)($|\/)/i,
  /config\.json$/i,
  /\/wp-(login|admin|json|includes|content|config)/i,
  /\/xmlrpc\.php$/i,
  /\.php$/i,
  /\/actuator(\/|$)/i,
  /\/telescope(\/|$)/i,
  /\/console(\/|$)/i,
  /\/server-status$/i,
  /\/v2\/_catalog$/i,
  /\/@vite\/env$/i,
  /\/login\.action$/i,
];

export const requestShield: RequestHandler = (req, res, next) => {
  const url = req.originalUrl || req.url;
  const isSuspicious = SUSPICIOUS_PATH_PATTERNS.some((pattern) => pattern.test(url));

  if (isSuspicious) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'none';

    logger.warn(
      `[RequestShield] Blocked scanner path: ${req.method} ${url} (IP: ${clientIp}, UA: ${userAgent})`,
    );

    res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Access denied',
    });
    return;
  }

  next();
};
