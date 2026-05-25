import type { NextFunction, Request, Response, RequestHandler } from 'express';

/**
 * Wraps an async route handler so thrown / rejected errors are forwarded to
 * the global error middleware. Removes try/catch boilerplate from controllers.
 */
export const catchAsync =
  <Req extends Request = Request, Res extends Response = Response>(
    fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
