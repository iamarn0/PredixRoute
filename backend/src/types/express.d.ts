import { UserRole } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        userId: string;
        organizationId: string;
        role: UserRole;
        email: string;
        publicId: string;
        jti: string;
      };
      tenant?: {
        organizationId: string;
      };
      apiKey?: {
        _id: string;
        organizationId: string;
        scopes: string[];
        rateLimitOverride: number | null;
      };
    }
  }
}

export {};
