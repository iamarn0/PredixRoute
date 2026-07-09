export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(code: string, message: string, details?: Record<string, unknown>) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code = 'AUTH_REQUIRED', message = 'Authentication required') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string) {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static tooManyRequests(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED') {
    return new ApiError(429, code, message);
  }
}
