import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export function getDatasetRoot(): string {
  return config.datasetRoot;
}

export function getOrgDatasetDir(organizationId: string, datasetPublicId: string): string {
  return path.join(getDatasetRoot(), organizationId, datasetPublicId);
}

export async function ensureDatasetDir(organizationId: string, datasetPublicId: string): Promise<string> {
  const dir = getOrgDatasetDir(organizationId, datasetPublicId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function resolveDatasetPath(relativePath: string): string {
  return path.join(getDatasetRoot(), relativePath);
}

export function toRelativePath(absolutePath: string): string {
  return path.relative(getDatasetRoot(), absolutePath).replace(/\\/g, '/');
}
