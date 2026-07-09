import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = (req.headers['x-request-id'] as string) ?? `req_${nanoid(12)}`;
  res.locals.requestId = req.requestId;
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
