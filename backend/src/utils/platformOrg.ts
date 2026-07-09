import { organizationRepository } from '../repositories/organization.repository';
import { ApiError } from './apiError';

const PLATFORM_ORG_SLUG = 'predixroute-platform';

let cachedPlatformOrgId: string | null = null;

export async function getPlatformOrganizationId(): Promise<string> {
  if (cachedPlatformOrgId) return cachedPlatformOrgId;
  const org = await organizationRepository.findBySlug(PLATFORM_ORG_SLUG);
  if (!org) {
    throw new ApiError(500, 'PLATFORM_ORG_MISSING', 'Platform organization is not configured. Run npm run seed.');
  }
  cachedPlatformOrgId = org._id.toString();
  return cachedPlatformOrgId;
}
