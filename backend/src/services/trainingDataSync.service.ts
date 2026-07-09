import { OrganizationModel } from '../models/organization.model';
import { trainingContributionService } from './trainingContribution.service';
import logger from '../utils/logger';

type SyncShipment = {
  externalRef: string;
  destinationPincode: string;
  weightGrams: number;
  cod: boolean;
  codAmount?: number | null;
  orderValue: number;
  courier: string;
  status: string;
  addressQualityScore?: number;
};

export class TrainingDataSyncService {
  async syncAllConsentedOrganizations() {
    const orgs = await OrganizationModel.find({
      'settings.trainingData.allowTrainingDataUse': true,
      'settings.trainingData.webhookSyncUrl': { $ne: null },
      deletedAt: null,
      status: 'ACTIVE',
    }).lean();

    for (const org of orgs) {
      const url = org.settings?.trainingData?.webhookSyncUrl;
      if (!url) continue;

      try {
        await this.syncOrganization(org._id.toString(), url, org.settings.trainingData.webhookSyncSecret);
      } catch (err) {
        logger.warn(`Training sync failed for org ${org.publicId}: ${String(err)}`);
      }
    }
  }

  async syncOrganization(organizationId: string, url: string, secret?: string | null) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (secret) headers['X-PredixRoute-Sync-Secret'] = secret;

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
      throw new Error(`Sync URL returned ${response.status}`);
    }

    const body = (await response.json()) as { shipments?: SyncShipment[] };
    const shipments = body.shipments ?? [];
    if (shipments.length === 0) {
      await OrganizationModel.findByIdAndUpdate(organizationId, {
        'settings.trainingData.lastSyncAt': new Date(),
      });
      return { synced: 0 };
    }

    const result = await trainingContributionService.ingestOutcomeApiBatch(organizationId, shipments);

    await OrganizationModel.findByIdAndUpdate(organizationId, {
      'settings.trainingData.lastSyncAt': new Date(),
    });

    return { synced: shipments.length, contributionId: result.publicId };
  }
}

export const trainingDataSyncService = new TrainingDataSyncService();
