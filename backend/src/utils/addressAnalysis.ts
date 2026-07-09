import { AddressAnalysis } from '../types/address.types';

const HOUSE_PATTERNS =
  /\b(flat|flt|house|h\.?\s*no|plot|door|room|rm|bldg|building|floor|#\s*\d|\d+[a-z]?[\/\-]\d+|\d+\s*,|\d{1,4}\s+(?:floor|flr))\b/i;
const STREET_PATTERNS =
  /\b(road|rd|street|st|lane|ln|avenue|ave|nagar|colony|sector|phase|block|layout|apartment|apt|society|village|mohalla|chowk|market|extension|extn|cross|main|gali|marg|path|park|enclave|township|industrial|estate)\b/i;
const LANDMARK_PATTERNS = /\b(near|opp|opposite|behind|beside|landmark|adjacent|next to|close to)\b/i;
const PINCODE_PATTERN = /\b(\d{6})\b/;

function clamp(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 1000) / 1000;
}

export function analyzeDeliveryAddress(
  rawAddress: string,
  destinationPincode: string,
): AddressAnalysis {
  const address = rawAddress.trim().replace(/\s+/g, ' ');
  const normalized = address.toLowerCase();
  const words = address.split(/\s+/).filter(Boolean);
  const pincodeMatch = PINCODE_PATTERN.exec(address);
  const pincodeInAddress = pincodeMatch?.[1] ?? null;
  const pincodeMatchesDestination = pincodeInAddress === destinationPincode;

  const hasHouseNumber = HOUSE_PATTERNS.test(normalized) || /^\d+[a-z]?(\s|,)/i.test(address);
  const hasStreetOrArea = STREET_PATTERNS.test(normalized);
  const hasLandmark = LANDMARK_PATTERNS.test(normalized);

  const issues: string[] = [];
  const strengths: string[] = [];

  let score = 0.1;

  if (address.length >= 20) {
    score += 0.12;
    strengths.push('Address has sufficient detail length');
  } else {
    issues.push('Address is too short — add house/flat, street, and area');
  }

  if (address.length >= 45) score += 0.08;
  if (words.length >= 6) score += 0.08;

  if (hasHouseNumber) {
    score += 0.22;
    strengths.push('House or flat number detected');
  } else {
    issues.push('Missing house/flat/door number — high RTO risk for incomplete addresses');
  }

  if (hasStreetOrArea) {
    score += 0.22;
    strengths.push('Street, colony, or area name detected');
  } else {
    issues.push('Missing street, colony, or locality — couriers may fail to locate');
  }

  if (hasLandmark) {
    score += 0.06;
    strengths.push('Landmark reference helps last-mile delivery');
  }

  if (pincodeInAddress) {
    if (pincodeMatchesDestination) {
      score += 0.12;
      strengths.push('Pincode in address matches destination pincode');
    } else {
      score -= 0.18;
      issues.push(
        `Pincode in address (${pincodeInAddress}) does not match destination pincode (${destinationPincode})`,
      );
    }
  } else if (/^\d{6}$/.test(destinationPincode)) {
    // Pincode is captured separately — do not require it duplicated in address text
    score += 0.12;
    strengths.push('Destination pincode provided');
  }

  const pincodeVerified =
    pincodeMatchesDestination || (!pincodeInAddress && /^\d{6}$/.test(destinationPincode));

  if (/^(?:\d{6}\s*)?[a-z\s,.-]{0,20}$/i.test(address) && !hasHouseNumber) {
    score -= 0.15;
    issues.push('Address looks too vague — only pincode or city without delivery point');
  }

  const commaParts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (commaParts.length >= 3) {
    score += 0.06;
    strengths.push('Structured address with multiple components');
  }

  return {
    qualityScore: clamp(score),
    pincodeMatch: pincodeVerified,
    pincodeInAddress,
    hasHouseNumber,
    hasStreetOrArea,
    hasLandmark,
    wordCount: words.length,
    issues,
    strengths,
  };
}

export function enrichEvaluateInput<T extends { destinationPincode: string; deliveryAddress?: string; addressQualityScore?: number }>(
  input: T,
): T & { addressQualityScore: number; addressAnalysis?: AddressAnalysis } {
  if (!input.deliveryAddress?.trim()) {
    return {
      ...input,
      addressQualityScore: input.addressQualityScore ?? 0.5,
    };
  }

  const analysis = analyzeDeliveryAddress(input.deliveryAddress, input.destinationPincode);
  return {
    ...input,
    addressQualityScore: analysis.qualityScore,
    addressAnalysis: analysis,
  };
}
