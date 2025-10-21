import { calculateRCMMetrics } from '../src/utils/dashboard';
import { calculateClaimBalance, isClaimFullyPaid } from '../src/data/claims';
import type { Claim, ClaimStatus } from '../src/data/claims';

// Helper function to create a mock claim
const createMockClaim = (
  id: string,
  status: ClaimStatus,
  totalAmount: number,
  dos: string,
  payments?: Array<{ amount: number }>
): Claim => ({
  id,
  encounter_id: `enc-${id}`,
  patient: { id: parseInt(id), name: `Patient ${id}` },
  payer: { id: 1, name: 'Test Payer' },
  dos,
  visit_type: 'Office Visit',
  state: 'NY',
  total_amount: totalAmount,
  status,
  confidence: 0.95,
  issues: [],
  suggested_fixes: [],
  validation_results: [],
  field_confidences: {},
  auto_submitted: false,
  attempt_count: 1,
  state_history: [],
  chart_note: {
    provider: 'Dr. Test',
    paragraphs: [[{ text: 'Test note' }]]
  },
  codes: {
    icd10: ['Z00.00'],
    cpt: [{ code: '99213', description: 'Office Visit', amount: totalAmount }],
    pos: '11'
  },
  provider: 'Dr. Test',
  updatedAt: '2024-01-01T12:00:00Z',
  payments: payments?.map((p, i) => ({
    id: `pay-${i}`,
    claim_id: id,
    amount: p.amount,
    date: '2024-01-01T12:00:00Z',
    payer: 'Test Payer',
    created_at: '2024-01-01T12:00:00Z',
  }))
});

// Helper function to create date string X days ago
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// Helper function to calculate expected days between dates (matching the implementation)
const expectedDaysBetween = (startDate: string, endDate: Date = new Date()): number => {
  const start = new Date(startDate);
  const diffTime = endDate.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

describe('calculateRCMMetrics', () => {
  describe('Basic Functionality', () => {
    it('should handle empty claims array', () => {
      const result = calculateRCMMetrics([]);
      
      expect(result).toEqual({
        daysInAR: null,
        maxDaysOutstanding: null,
        agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        agingCounts: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        totalOutstandingAR: 0
      });
    });

    it('should exclude paid claims from calculations', () => {
      const dos15 = daysAgo(15);
      const claims = [
        createMockClaim('1', 'paid', 100, daysAgo(30)),
        createMockClaim('2', 'accepted_277ca', 200, dos15),
        createMockClaim('3', 'denied', 150, daysAgo(45))
      ];
      
      const result = calculateRCMMetrics(claims);
      const expectedDays = expectedDaysBetween(dos15);
      
      // Only claim 2 should be counted (accepted_277ca with no payments)
      expect(result.totalOutstandingAR).toBe(200);
      expect(result.agingBuckets['0-30']).toBe(200);
      expect(result.agingCounts['0-30']).toBe(1);
      expect(result.daysInAR).toBe(expectedDays);
    });

    it('should exclude fully paid claims even if status is not "paid"', () => {
      const dos25 = daysAgo(25);
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, daysAgo(20), [{ amount: 100 }]), // Fully paid
        createMockClaim('2', 'accepted_277ca', 200, dos25, [{ amount: 150 }]), // Partially paid
      ];
      
      const result = calculateRCMMetrics(claims);
      const expectedDays = expectedDaysBetween(dos25);
      
      // Only partially paid claim should be counted with remaining balance
      expect(result.totalOutstandingAR).toBe(50); // 200 - 150
      expect(result.agingBuckets['0-30']).toBe(50);
      expect(result.agingCounts['0-30']).toBe(1);
      expect(result.daysInAR).toBe(expectedDays);
    });
  });

  describe('Aging Bucket Calculations', () => {
    it('should correctly categorize claims by aging buckets', () => {
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, daysAgo(15)), // 0-30 bucket
        createMockClaim('2', 'accepted_277ca', 200, daysAgo(45)), // 31-60 bucket  
        createMockClaim('3', 'accepted_277ca', 150, daysAgo(75)), // 61-90 bucket
        createMockClaim('4', 'accepted_277ca', 300, daysAgo(120)), // 90+ bucket
      ];
      
      const result = calculateRCMMetrics(claims);
      
      expect(result.agingBuckets['0-30']).toBe(100);
      expect(result.agingBuckets['31-60']).toBe(200);
      expect(result.agingBuckets['61-90']).toBe(150);
      expect(result.agingBuckets['90+']).toBe(300);
      
      expect(result.agingCounts['0-30']).toBe(1);
      expect(result.agingCounts['31-60']).toBe(1);
      expect(result.agingCounts['61-90']).toBe(1);
      expect(result.agingCounts['90+']).toBe(1);
      
      expect(result.totalOutstandingAR).toBe(750);
    });

    it('should handle boundary conditions for aging buckets', () => {
      // Use specific dates to test boundary conditions based on actual implementation logic
      const dos30 = daysAgo(30);  // Should be 0-30 bucket (daysOld <= 30)
      const dos31 = daysAgo(31);  // Should be 31-60 bucket (daysOld <= 60)
      const dos60 = daysAgo(60);  // Should be 31-60 bucket (daysOld <= 60)
      const dos61 = daysAgo(61);  // Should be 61-90 bucket (daysOld <= 90)
      const dos90 = daysAgo(90);  // Should be 61-90 bucket (daysOld <= 90)
      const dos91 = daysAgo(91);  // Should be 90+ bucket (daysOld > 90)
      
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, dos30),
        createMockClaim('2', 'accepted_277ca', 200, dos31),
        createMockClaim('3', 'accepted_277ca', 150, dos60),
        createMockClaim('4', 'accepted_277ca', 175, dos61),
        createMockClaim('5', 'accepted_277ca', 300, dos90),
        createMockClaim('6', 'accepted_277ca', 250, dos91),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Calculate expected days for each claim to determine buckets
      const days30 = expectedDaysBetween(dos30);
      const days31 = expectedDaysBetween(dos31);
      const days60 = expectedDaysBetween(dos60);
      const days61 = expectedDaysBetween(dos61);
      const days90 = expectedDaysBetween(dos90);
      const days91 = expectedDaysBetween(dos91);
      
      // Verify the bucket logic matches the implementation:
      // if (daysOld <= 30) -> '0-30'
      // else if (daysOld <= 60) -> '31-60'
      // else if (daysOld <= 90) -> '61-90'
      // else -> '90+'
      
      let expected030 = 0, expected3160 = 0, expected6190 = 0, expected90plus = 0;
      
      if (days30 <= 30) expected030 += 100;
      else if (days30 <= 60) expected3160 += 100;
      else if (days30 <= 90) expected6190 += 100;
      else expected90plus += 100;
      
      if (days31 <= 30) expected030 += 200;
      else if (days31 <= 60) expected3160 += 200;
      else if (days31 <= 90) expected6190 += 200;
      else expected90plus += 200;
      
      if (days60 <= 30) expected030 += 150;
      else if (days60 <= 60) expected3160 += 150;
      else if (days60 <= 90) expected6190 += 150;
      else expected90plus += 150;
      
      if (days61 <= 30) expected030 += 175;
      else if (days61 <= 60) expected3160 += 175;
      else if (days61 <= 90) expected6190 += 175;
      else expected90plus += 175;
      
      if (days90 <= 30) expected030 += 300;
      else if (days90 <= 60) expected3160 += 300;
      else if (days90 <= 90) expected6190 += 300;
      else expected90plus += 300;
      
      if (days91 <= 30) expected030 += 250;
      else if (days91 <= 60) expected3160 += 250;
      else if (days91 <= 90) expected6190 += 250;
      else expected90plus += 250;
      
      expect(result.agingBuckets['0-30']).toBe(expected030);
      expect(result.agingBuckets['31-60']).toBe(expected3160);
      expect(result.agingBuckets['61-90']).toBe(expected6190);
      expect(result.agingBuckets['90+']).toBe(expected90plus);
    });
  });

  describe('Days in AR Calculations', () => {
    it('should calculate average days in AR correctly', () => {
      const dos10 = daysAgo(10);
      const dos20 = daysAgo(20);
      const dos30 = daysAgo(30);
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, dos10),
        createMockClaim('2', 'accepted_277ca', 200, dos20),
        createMockClaim('3', 'accepted_277ca', 150, dos30),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Calculate expected average
      const days10 = expectedDaysBetween(dos10);
      const days20 = expectedDaysBetween(dos20);
      const days30 = expectedDaysBetween(dos30);
      const expectedAvg = Math.round((days10 + days20 + days30) / 3);
      
      expect(result.daysInAR).toBe(expectedAvg);
    });

    it('should calculate maxDaysOutstanding correctly', () => {
      const dos120 = daysAgo(120); // Oldest
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, daysAgo(45)),
        createMockClaim('2', 'accepted_277ca', 200, dos120),
        createMockClaim('3', 'accepted_277ca', 150, daysAgo(75)),
      ];
      
      const result = calculateRCMMetrics(claims);
      const expectedMaxDays = expectedDaysBetween(dos120);
      
      expect(result.maxDaysOutstanding).toBe(expectedMaxDays);
    });

    it('should round average days in AR to nearest integer', () => {
      const dos10 = daysAgo(10);
      const dos11 = daysAgo(11);
      const dos12 = daysAgo(12);
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, dos10),
        createMockClaim('2', 'accepted_277ca', 200, dos11),
        createMockClaim('3', 'accepted_277ca', 150, dos12),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Calculate expected average
      const days10 = expectedDaysBetween(dos10);
      const days11 = expectedDaysBetween(dos11);
      const days12 = expectedDaysBetween(dos12);
      const expectedAvg = Math.round((days10 + days11 + days12) / 3);
      
      expect(result.daysInAR).toBe(expectedAvg);
    });
  });

  describe('Payment Integration', () => {
    it('should use outstanding balance after payments', () => {
      const dos30 = daysAgo(30);
      const dos45 = daysAgo(45);
      const claims = [
        createMockClaim('1', 'accepted_277ca', 1000, dos30, [
          { amount: 600 }, // Partial payment
          { amount: 200 }  // Another partial payment
        ]), // Outstanding: 1000 - 800 = 200
        createMockClaim('2', 'accepted_277ca', 500, dos45, [
          { amount: 300 } // Partial payment
        ]), // Outstanding: 500 - 300 = 200
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Calculate expected days to determine buckets
      const days30 = expectedDaysBetween(dos30);
      const days45 = expectedDaysBetween(dos45);
      
      expect(result.totalOutstandingAR).toBe(400); // 200 + 200
      
      // Determine which bucket each claim should be in
      if (days30 <= 30) {
        expect(result.agingBuckets['0-30']).toBe(200);
        expect(result.agingCounts['0-30']).toBe(1);
      } else if (days30 <= 60) {
        expect(result.agingBuckets['31-60']).toBeGreaterThanOrEqual(200);
        expect(result.agingCounts['31-60']).toBeGreaterThanOrEqual(1);
      }
      
      if (days45 <= 30) {
        expect(result.agingBuckets['0-30']).toBeGreaterThanOrEqual(200);
      } else if (days45 <= 60) {
        expect(result.agingBuckets['31-60']).toBeGreaterThanOrEqual(200);
        expect(result.agingCounts['31-60']).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle overpayments correctly', () => {
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, daysAgo(30), [
          { amount: 120 } // Overpayment
        ]),
        createMockClaim('2', 'accepted_277ca', 200, daysAgo(45))
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Overpaid claim should have 0 outstanding balance (Math.max prevents negative)
      expect(result.totalOutstandingAR).toBe(200); // Only claim 2
      expect(result.agingBuckets['31-60']).toBe(200);
      expect(result.agingCounts['31-60']).toBe(1);
      expect(result.agingCounts['0-30']).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should return null for daysInAR when no outstanding claims', () => {
      const claims = [
        createMockClaim('1', 'paid', 100, daysAgo(30)),
        createMockClaim('2', 'denied', 200, daysAgo(45))
      ];
      
      const result = calculateRCMMetrics(claims);
      
      expect(result.daysInAR).toBe(null);
      expect(result.maxDaysOutstanding).toBe(null);
      expect(result.totalOutstandingAR).toBe(0);
    });

    it('should handle claims with no payments array', () => {
      const dos30 = daysAgo(30);
      const claim = createMockClaim('1', 'accepted_277ca', 100, dos30);
      delete claim.payments; // Remove payments array
      
      const result = calculateRCMMetrics([claim]);
      const expectedDays = expectedDaysBetween(dos30);
      
      expect(result.totalOutstandingAR).toBe(100);
      expect(result.daysInAR).toBe(expectedDays);
      
      // Check which bucket it should be in based on actual days
      if (expectedDays <= 30) {
        expect(result.agingBuckets['0-30']).toBe(100);
      } else if (expectedDays <= 60) {
        expect(result.agingBuckets['31-60']).toBe(100);
      } else if (expectedDays <= 90) {
        expect(result.agingBuckets['61-90']).toBe(100);
      } else {
        expect(result.agingBuckets['90+']).toBe(100);
      }
    });

    it('should handle today\'s date edge case', () => {
      const today = new Date().toISOString().split('T')[0];
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, today)
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Should be 0 or 1 days depending on calculation
      expect(result.daysInAR).toBeGreaterThanOrEqual(0);
      expect(result.daysInAR).toBeLessThanOrEqual(1);
      expect(result.agingBuckets['0-30']).toBe(100);
    });

    it('should handle multiple claims in same bucket', () => {
      const dos105 = daysAgo(105); // Oldest
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100, daysAgo(95)),
        createMockClaim('2', 'accepted_277ca', 200, daysAgo(100)),
        createMockClaim('3', 'accepted_277ca', 150, dos105),
      ];
      
      const result = calculateRCMMetrics(claims);
      const expectedMaxDays = expectedDaysBetween(dos105);
      
      expect(result.agingBuckets['90+']).toBe(450); // 100 + 200 + 150
      expect(result.agingCounts['90+']).toBe(3);
      expect(result.maxDaysOutstanding).toBe(expectedMaxDays);
    });
  });

  describe('Payment Utility Functions', () => {
    it('calculateClaimBalance should work correctly', () => {
      const claim = createMockClaim('1', 'accepted_277ca', 1000, daysAgo(30), [
        { amount: 600 },
        { amount: 200 }
      ]);
      
      const balance = calculateClaimBalance(claim);
      expect(balance).toBe(200); // 1000 - 600 - 200
    });

    it('isClaimFullyPaid should work correctly', () => {
      const fullyPaid = createMockClaim('1', 'accepted_277ca', 100, daysAgo(30), [
        { amount: 100 }
      ]);
      const partiallyPaid = createMockClaim('2', 'accepted_277ca', 200, daysAgo(30), [
        { amount: 150 }
      ]);
      const unpaid = createMockClaim('3', 'accepted_277ca', 300, daysAgo(30));
      
      expect(isClaimFullyPaid(fullyPaid)).toBe(true);
      expect(isClaimFullyPaid(partiallyPaid)).toBe(false);
      expect(isClaimFullyPaid(unpaid)).toBe(false);
    });

    it('calculateClaimBalance should handle no payments', () => {
      const claim = createMockClaim('1', 'accepted_277ca', 100, daysAgo(30));
      delete claim.payments;
      
      const balance = calculateClaimBalance(claim);
      expect(balance).toBe(100);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle null/undefined input gracefully', () => {
      const result = calculateRCMMetrics(null as any);
      expect(result.totalOutstandingAR).toBe(0);
      expect(result.daysInAR).toBe(null);
    });

    it('should handle claims with invalid dates', () => {
      const claimsWithInvalidDates = [
        createMockClaim('1', 'accepted_277ca', 100, ''),
        createMockClaim('2', 'accepted_277ca', 200, 'invalid-date'),
        createMockClaim('3', 'accepted_277ca', 150, daysAgo(30)), // Valid claim
      ];
      
      const result = calculateRCMMetrics(claimsWithInvalidDates);
      
      // Should handle invalid dates gracefully and still process valid ones
      expect(result.totalOutstandingAR).toBeGreaterThan(0);
    });

    it('should handle very large amounts', () => {
      const dos30 = daysAgo(30);
      const dos45 = daysAgo(45);
      const claims = [
        createMockClaim('1', 'accepted_277ca', 999999999, dos30),
        createMockClaim('2', 'accepted_277ca', 1000000000, dos45),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Calculate expected days to determine buckets
      const days30 = expectedDaysBetween(dos30);
      const days45 = expectedDaysBetween(dos45);
      
      expect(result.totalOutstandingAR).toBe(1999999999);
      
      // Check buckets based on actual calculated days
      if (days30 <= 30 && days45 <= 30) {
        expect(result.agingBuckets['0-30']).toBe(1999999999);
      } else if (days30 <= 30 && days45 <= 60) {
        expect(result.agingBuckets['0-30']).toBe(999999999);
        expect(result.agingBuckets['31-60']).toBe(1000000000);
      } else if (days30 <= 60 && days45 <= 60) {
        expect(result.agingBuckets['31-60']).toBe(1999999999);
      }
    });

    it('should handle negative payment amounts gracefully', () => {
      const claimWithNegativePayment = createMockClaim('1', 'accepted_277ca', 100, daysAgo(30), [
        { amount: -50 } // Invalid negative payment
      ]);
      
      const result = calculateRCMMetrics([claimWithNegativePayment]);
      
      // Should still calculate correctly despite invalid payment
      expect(result.totalOutstandingAR).toBeGreaterThan(0);
    });

    it('should handle claims with very old dates (leap years, etc.)', () => {
      const veryOldClaims = [
        createMockClaim('1', 'accepted_277ca', 100, '2020-02-29'), // Leap year
        createMockClaim('2', 'accepted_277ca', 200, '2019-12-31'), // Year boundary
        createMockClaim('3', 'accepted_277ca', 150, '2023-01-01'), // New year
      ];
      
      const result = calculateRCMMetrics(veryOldClaims);
      
      expect(result.totalOutstandingAR).toBe(450);
      expect(result.agingBuckets['90+']).toBe(450); // All should be very old
      expect(result.daysInAR).toBeGreaterThan(1000); // Very high number of days
    });

    it('should handle mixed claim statuses correctly', () => {
      const mixedClaims = [
        createMockClaim('1', 'needs_review', 100, daysAgo(30)),
        createMockClaim('2', 'built', 200, daysAgo(45)),
        createMockClaim('3', 'submitted', 150, daysAgo(60)),
        createMockClaim('4', 'awaiting_277ca', 300, daysAgo(90)),
        createMockClaim('5', 'accepted_277ca', 250, daysAgo(120)),
        createMockClaim('6', 'rejected_277ca', 180, daysAgo(30)),
        createMockClaim('7', 'paid', 400, daysAgo(15)), // Should be excluded
        createMockClaim('8', 'denied', 350, daysAgo(75)), // Should be excluded
      ];
      
      const result = calculateRCMMetrics(mixedClaims);
      
      // Should include all non-paid/denied claims
      // Claims 1-6: 100 + 200 + 150 + 300 + 250 + 180 = 1180
      // rejected_277ca is NOT excluded based on implementation (only 'denied' and 'paid' are excluded)
      expect(result.totalOutstandingAR).toBe(1180); // Sum of claims 1-6
      
      // Count will vary based on actual days calculated, but total should be 6 claims
      const totalCounts = Object.values(result.agingCounts).reduce((sum, count) => sum + count, 0);
      expect(totalCounts).toBe(6); // Claims 1-6 (excluding only paid and denied)
    });

    it('should handle floating point precision issues', () => {
      const dos30 = daysAgo(30);
      const dos45 = daysAgo(45);
      const dos60 = daysAgo(60);
      const claims = [
        createMockClaim('1', 'accepted_277ca', 100.33, dos30),
        createMockClaim('2', 'accepted_277ca', 200.67, dos45),
        createMockClaim('3', 'accepted_277ca', 150.99, dos60),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      // Calculate expected days to determine buckets
      const days30 = expectedDaysBetween(dos30);
      const days45 = expectedDaysBetween(dos45);
      const days60 = expectedDaysBetween(dos60);
      
      // Should handle floating point arithmetic correctly
      expect(result.totalOutstandingAR).toBeCloseTo(451.99, 2);
      
      // Check buckets based on actual calculated days
      let expected030 = 0, expected3160 = 0, expected6190 = 0;
      
      if (days30 <= 30) expected030 += 100.33;
      else if (days30 <= 60) expected3160 += 100.33;
      else if (days30 <= 90) expected6190 += 100.33;
      
      if (days45 <= 30) expected030 += 200.67;
      else if (days45 <= 60) expected3160 += 200.67;
      else if (days45 <= 90) expected6190 += 200.67;
      
      if (days60 <= 30) expected030 += 150.99;
      else if (days60 <= 60) expected3160 += 150.99;
      else if (days60 <= 90) expected6190 += 150.99;
      
      if (expected030 > 0) expect(result.agingBuckets['0-30']).toBeCloseTo(expected030, 2);
      if (expected3160 > 0) expect(result.agingBuckets['31-60']).toBeCloseTo(expected3160, 2);
      if (expected6190 > 0) expect(result.agingBuckets['61-90']).toBeCloseTo(expected6190, 2);
    });

    it('should handle performance with large datasets', () => {
      // Create 1000 claims to test performance
      const largeClaims = Array.from({ length: 1000 }, (_, i) =>
        createMockClaim(i.toString(), 'accepted_277ca', 100 + i, daysAgo(i % 200))
      );
      
      const startTime = Date.now();
      const result = calculateRCMMetrics(largeClaims);
      const endTime = Date.now();
      
      // Should complete within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.totalOutstandingAR).toBeGreaterThan(0);
      expect(result.agingCounts['0-30']).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should ensure aging bucket amounts sum to total outstanding AR', () => {
      const claims = [
        createMockClaim('1', 'accepted_277ca', 1000, daysAgo(15)),
        createMockClaim('2', 'accepted_277ca', 2000, daysAgo(45)),
        createMockClaim('3', 'accepted_277ca', 1500, daysAgo(75)),
        createMockClaim('4', 'accepted_277ca', 3000, daysAgo(120)),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      const bucketSum = Object.values(result.agingBuckets).reduce((sum, amount) => sum + amount, 0);
      expect(bucketSum).toBeCloseTo(result.totalOutstandingAR, 2);
    });

    it('should ensure aging bucket counts sum correctly', () => {
      const claims = [
        createMockClaim('1', 'accepted_277ca', 1000, daysAgo(15)),
        createMockClaim('2', 'accepted_277ca', 2000, daysAgo(45)),
        createMockClaim('3', 'accepted_277ca', 1500, daysAgo(75)),
      ];
      
      const result = calculateRCMMetrics(claims);
      
      const countSum = Object.values(result.agingCounts).reduce((sum, count) => sum + count, 0);
      expect(countSum).toBe(3); // Should equal number of outstanding claims
    });

    it('should validate that maxDaysOutstanding is actually the maximum', () => {
      const dos120 = daysAgo(120); // Should be max
      const claims = [
        createMockClaim('1', 'accepted_277ca', 1000, daysAgo(15)),
        createMockClaim('2', 'accepted_277ca', 2000, daysAgo(45)),
        createMockClaim('3', 'accepted_277ca', 1500, dos120),
        createMockClaim('4', 'accepted_277ca', 3000, daysAgo(75)),
      ];
      
      const result = calculateRCMMetrics(claims);
      const expectedMaxDays = expectedDaysBetween(dos120);
      
      expect(result.maxDaysOutstanding).toBe(expectedMaxDays);
      
      // Verify it's actually the maximum by checking all claims
      const now = new Date();
      const allDays = claims.map(claim => {
        const start = new Date(claim.dos);
        const diffTime = now.getTime() - start.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      });
      
      expect(result.maxDaysOutstanding).toBe(Math.max(...allDays));
    });
  });
});