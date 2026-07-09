export type UserRole = 'SUPER_ADMIN' | 'ORGANIZATION_ADMIN' | 'ANALYST';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'DEACTIVATED';

export interface AccessTokenPayload {
  sub: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
  type: 'access';
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;
  userId: string;
  organizationId: string;
  type: 'refresh';
  jti: string;
  familyId: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AdminRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  adminSecret?: string;
}

export type AuthPortal = 'user' | 'admin';
