import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.types';
import { generateFamilyId, generateToken } from './idUtils';

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type' | 'jti'>): {
  token: string;
  jti: string;
} {
  const jti = generateToken(16);
  const token = jwt.sign({ ...payload, type: 'access', jti }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as SignOptions);
  return { token, jti };
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'type' | 'jti' | 'familyId'>,
  familyId?: string,
): { token: string; jti: string; familyId: string } {
  const jti = generateToken(16);
  const family = familyId ?? generateFamilyId();
  const token = jwt.sign(
    { ...payload, type: 'refresh', jti, familyId: family },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry } as SignOptions,
  );
  return { token, jti, familyId: family };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}
