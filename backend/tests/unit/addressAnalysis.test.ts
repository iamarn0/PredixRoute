import { analyzeDeliveryAddress, enrichEvaluateInput } from '../../src/utils/addressAnalysis';

describe('addressAnalysis', () => {
  it('scores a complete address highly', () => {
    const analysis = analyzeDeliveryAddress(
      'Flat 402, Rose Apartments, MG Road, Koramangala, Bengaluru, Karnataka 560034',
      '560034',
    );
    expect(analysis.qualityScore).toBeGreaterThan(0.7);
    expect(analysis.hasHouseNumber).toBe(true);
    expect(analysis.hasStreetOrArea).toBe(true);
    expect(analysis.pincodeMatch).toBe(true);
  });

  it('penalizes vague addresses', () => {
    const analysis = analyzeDeliveryAddress('560034', '560034');
    expect(analysis.qualityScore).toBeLessThan(0.4);
    expect(analysis.issues.length).toBeGreaterThan(0);
  });

  it('flags pincode mismatch', () => {
    const analysis = analyzeDeliveryAddress(
      'House 12, Main Road, Delhi 110001',
      '560034',
    );
    expect(analysis.pincodeMatch).toBe(false);
    expect(analysis.issues.some((i) => i.includes('does not match'))).toBe(true);
  });

  it('does not require pincode in address when destination pincode field is provided', () => {
    const analysis = analyzeDeliveryAddress(
      'Flat 12, Block A, Connaught Place, New Delhi, Delhi',
      '110001',
    );
    expect(analysis.pincodeMatch).toBe(true);
    expect(analysis.pincodeInAddress).toBeNull();
    expect(analysis.issues.some((i) => i.includes('Pincode not found'))).toBe(false);
    expect(analysis.strengths.some((s) => s.includes('Destination pincode provided'))).toBe(true);
  });

  it('enriches evaluate input with computed quality score', () => {
    const enriched = enrichEvaluateInput({
      destinationPincode: '110001',
      deliveryAddress: 'H.No 45, Block C, Saket, New Delhi 110001',
    });
    expect(enriched.addressQualityScore).toBeGreaterThan(0.5);
    expect(enriched.addressAnalysis?.hasHouseNumber).toBe(true);
  });
});
