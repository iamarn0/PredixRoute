import crypto from 'crypto';
import { nanoid } from 'nanoid';

const PREFIXES = ['org', 'usr', 'key', 'shp', 'prd', 'dset', 'mdl', 'wh', 'rpt', 'cvf', 'tct', 'bpj'] as const;
export type PublicIdPrefix = (typeof PREFIXES)[number];

export function generatePublicId(prefix: PublicIdPrefix): string {
  return `${prefix}_${nanoid(12)}`;
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateApiKey(environment: 'LIVE' | 'TEST'): {
  key: string;
  hash: string;
  prefix: string;
} {
  const envPrefix = environment === 'LIVE' ? 'live' : 'test';
  const random = nanoid(32);
  const key = `prx_${envPrefix}_${random}`;
  return {
    key,
    hash: sha256(key),
    prefix: key.substring(0, 16),
  };
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateFamilyId(): string {
  return nanoid(16);
}
