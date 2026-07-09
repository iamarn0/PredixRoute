import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        ApiError.badRequest('VALIDATION_ERROR', 'Request validation failed', {
          fields: result.error.flatten().fieldErrors,
        }),
      );
      return;
    }
    req[source] = result.data;
    next();
  };
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  if (err instanceof ApiError) {
    logger.warn(`API error [${err.code}] ${err.statusCode} requestId=${requestId}`);
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
      requestId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten().fieldErrors,
      },
      requestId,
    });
  }

  logger.error(`Unhandled error requestId=${requestId}: ${err.message}`);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    requestId,
  });
}
