import { Response } from 'express';
import { PaginatedResult } from '../interfaces/repository.interface';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  return res.status(statusCode).json({
    success: true,
    data,
    requestId: res.locals.requestId,
    ...(meta ? { meta } : {}),
  });
}

export function sendPaginated<T>(res: Response, result: PaginatedResult<T>) {
  return sendSuccess(res, result.data, 200, { pagination: result.pagination });
}

export function classifyRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}
