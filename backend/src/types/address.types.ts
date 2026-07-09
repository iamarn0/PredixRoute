export interface AddressAnalysis {
  qualityScore: number;
  pincodeMatch: boolean;
  pincodeInAddress: string | null;
  hasHouseNumber: boolean;
  hasStreetOrArea: boolean;
  hasLandmark: boolean;
  wordCount: number;
  issues: string[];
  strengths: string[];
}
