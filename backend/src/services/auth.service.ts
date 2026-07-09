import { Types } from 'mongoose';
import { getRedis } from '../config/redis';
import { config } from '../config';
import { organizationRepository } from '../repositories/organization.repository';
import { userRepository } from '../repositories/user.repository';
import { apiPlanRepository } from '../repositories/apiPlan.repository';
import { apiSubscriptionRepository } from '../repositories/apiSubscription.repository';
import { RegisterInput, LoginInput, AdminRegisterInput } from '../types/auth.types';
import { ApiError } from '../utils/apiError';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';
import { generateToken } from '../utils/idUtils';
import { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/tokenUtils';
import { emailService } from './email.service';
import { emailQueue } from '../jobs/queues';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_TTL_SECONDS = 15 * 60;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 30;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

const PLATFORM_ORG_SLUG = 'predixroute-platform';

export class AuthService {
  async registerUser(input: RegisterInput) {
    const existing = await userRepository.findByEmailGlobal(input.email);
    if (existing) {
      throw ApiError.badRequest('EMAIL_EXISTS', 'An account with this email already exists');
    }

    let slug = slugify(input.organizationName);
    const slugExists = await organizationRepository.findBySlug(slug);
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const organization = await organizationRepository.create({
      name: input.organizationName,
      slug,
      billingEmail: input.email,
      status: 'ACTIVE',
    });

    const verificationToken = generateToken();
    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      organizationId: organization._id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'ORGANIZATION_ADMIN',
      status: config.env === 'development' ? 'ACTIVE' : 'PENDING_VERIFICATION',
      emailVerified: config.env === 'development',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 86400000),
    });

    const starterPlan = await apiPlanRepository.findBySlug('starter');
    if (starterPlan) {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 86400000);
      await apiSubscriptionRepository.create({
        organizationId: organization._id as Types.ObjectId,
        planId: starterPlan._id as Types.ObjectId,
        status: 'TRIAL',
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialEndsAt: trialEnd,
      });
    }

    if (config.env !== 'development') {
      const mail = emailService.buildVerificationEmail(input.email, verificationToken);
      await emailQueue.add('send', mail, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    }

    return {
      user: this.sanitizeUser(user),
      organization: { publicId: organization.publicId, name: organization.name, slug: organization.slug },
      message: config.env === 'development'
        ? 'Registration successful. Account auto-activated in development.'
        : 'Registration successful. Please verify your email.',
    };
  }

  async registerAdmin(input: AdminRegisterInput) {
    if (config.isProduction && !config.adminRegistrationSecret) {
      throw new ApiError(403, 'ADMIN_REGISTRATION_DISABLED', 'Admin self-registration is disabled');
    }

    if (config.adminRegistrationSecret) {
      if (input.adminSecret !== config.adminRegistrationSecret) {
        throw new ApiError(403, 'INVALID_ADMIN_SECRET', 'Invalid admin registration secret');
      }
    }

    const existing = await userRepository.findByEmailGlobal(input.email);
    if (existing) {
      throw ApiError.badRequest('EMAIL_EXISTS', 'An account with this email already exists');
    }

    let organization = await organizationRepository.findBySlug(PLATFORM_ORG_SLUG);
    if (!organization) {
      organization = await organizationRepository.create({
        name: 'PredixRoute Platform',
        slug: PLATFORM_ORG_SLUG,
        billingEmail: input.email,
        status: 'ACTIVE',
      });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      organizationId: organization._id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    });

    return {
      user: this.sanitizeUser(user),
      message: 'Platform admin account created. You can sign in at the admin portal.',
    };
  }

  async loginUser(input: LoginInput, ip: string) {
    const result = await this.authenticate(input, ip);
    if (result.user.role === 'SUPER_ADMIN') {
      throw new ApiError(
        403,
        'WRONG_PORTAL',
        'Platform admin accounts must sign in at the admin portal',
      );
    }
    return result;
  }

  async loginAdmin(input: LoginInput, ip: string) {
    const result = await this.authenticate(input, ip);
    if (result.user.role !== 'SUPER_ADMIN') {
      throw new ApiError(
        403,
        'WRONG_PORTAL',
        'Customer accounts must sign in at the customer portal',
      );
    }
    return result;
  }

  private async authenticate(input: LoginInput, ip: string) {
    const user = await userRepository.findByEmailGlobal(input.email, true);
    if (!user) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError(423, 'ACCOUNT_LOCKED', 'Account is temporarily locked. Try again later.');
    }

    if (user.status === 'PENDING_VERIFICATION') {
      throw ApiError.unauthorized('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const updates: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= LOCKOUT_THRESHOLD) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        updates.failedLoginAttempts = 0;
      }
      await userRepository.updateById(user._id.toString(), updates);
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    await userRepository.updateById(user._id.toString(), {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    const organization = await organizationRepository.findById(user.organizationId.toString());
    if (organization?.status === 'SUSPENDED') {
      throw new ApiError(403, 'ORG_SUSPENDED', 'Your organization has been suspended. Contact support.');
    }

    const tokens = await this.issueTokens(user, organization?.publicId ?? '');

    return {
      user: this.sanitizeUser(user),
      organization: organization
        ? { publicId: organization.publicId, name: organization.name, slug: organization.slug }
        : null,
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    const redis = getRedis();
    const stored = await redis.get(`refresh:${payload.jti}`);
    if (!stored) {
      await redis.del(`refresh_family:${payload.familyId}`);
      throw ApiError.unauthorized('REFRESH_TOKEN_REUSED', 'Refresh token has been revoked');
    }

    await redis.del(`refresh:${payload.jti}`);

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'User not found or inactive');
    }

    const organization = await organizationRepository.findById(user.organizationId.toString());
    return this.issueTokens(user, organization?.publicId ?? '', payload.familyId);
  }

  async logout(refreshToken: string | undefined, accessToken?: string) {
    const redis = getRedis();
    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        await redis.setex(`revoked:${payload.jti}`, ACCESS_TTL_SECONDS, '1');
      } catch {
        // ignore invalid access token on logout
      }
    }
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      await redis.del(`refresh:${payload.jti}`);
      await redis.srem(`refresh_family:${payload.familyId}`, payload.jti);
    } catch {
      // ignore invalid token on logout
    }
  }

  async verifyEmail(token: string) {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired verification token');
    }
    await userRepository.updateById(user._id.toString(), {
      status: 'ACTIVE',
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmailGlobal(email);
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }
    const resetToken = generateToken();
    await userRepository.updateById(user._id.toString(), {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000),
    });
    const mail = emailService.buildPasswordResetEmail(email, resetToken);
    await emailQueue.add('send', mail, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, password: string) {
    const user = await userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired reset token');
    }
    const passwordHash = await hashPassword(password);
    await userRepository.updateById(user._id.toString(), {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    return { message: 'Password reset successful. Please sign in.' };
  }

  private async issueTokens(user: { _id: Types.ObjectId; publicId: string; email: string; role: string; organizationId: Types.ObjectId }, _orgPublicId: string, familyId?: string) {
    const access = signAccessToken({
      sub: user.publicId,
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role as 'ORGANIZATION_ADMIN',
      email: user.email,
    });

    const refresh = signRefreshToken(
      {
        sub: user.publicId,
        userId: user._id.toString(),
        organizationId: user.organizationId.toString(),
      },
      familyId,
    );

    const redis = getRedis();
    await redis.setex(
      `refresh:${refresh.jti}`,
      REFRESH_TTL_SECONDS,
      JSON.stringify({ userId: user._id.toString(), familyId: refresh.familyId }),
    );
    await redis.sadd(`refresh_family:${refresh.familyId}`, refresh.jti);
    await redis.expire(`refresh_family:${refresh.familyId}`, REFRESH_TTL_SECONDS);

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
    };
  }

  private sanitizeUser(user: { publicId: string; email: string; firstName: string; lastName: string; role: string; organizationId: Types.ObjectId }) {
    return {
      publicId: user.publicId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId.toString(),
    };
  }
}

export const authService = new AuthService();
