import { STATUS_ORDER } from '../src/data/claims';
import type { Claim, ClaimStatus } from '../src/data/claims';

// Mock claim data for testing
const createMockClaim = (
  id: string,
  status: ClaimStatus,
  total_amount: number,
  updatedAt: string = new Date().toISOString()
): Claim => ({
  id,
  encounter_id: `enc-${id}`,
  patient: { id: parseInt(id), name: `Patient ${id}` },
  payer: { id: 1, name: 'Test Payer' },
  dos: '2024-01-01',
  visit_type: 'Office Visit',
  state: 'NY',
  total_amount,
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
    cpt: [{ code: '99213', description: 'Office Visit', amount: total_amount }],
    pos: '11'
  },
  provider: 'Dr. Test',
  updatedAt
});

// Test sample claims with varying amounts and statuses
const sampleClaims: Claim[] = [
  createMockClaim('1', 'needs_review', 150.00, '2024-01-01T10:00:00Z'),
  createMockClaim('2', 'built', 300.00, '2024-01-01T11:00:00Z'),
  createMockClaim('3', 'rejected_277ca', 75.00, '2024-01-01T09:00:00Z'),
  createMockClaim('4', 'paid', 200.00, '2024-01-01T12:00:00Z'),
  createMockClaim('5', 'needs_review', 500.00, '2024-01-01T08:00:00Z'),
  createMockClaim('6', 'submitted', 120.00, '2024-01-01T13:00:00Z'),
  createMockClaim('7', 'denied', 400.00, '2024-01-01T14:00:00Z'),
  createMockClaim('8', 'awaiting_277ca', 90.00, '2024-01-01T15:00:00Z'),
];

// Sorting function extracted from the claims page logic
const sortClaimsWithDollarFirst = (claims: Claim[], dollarFirst: boolean) => {
  return [...claims].sort((a, b) => {
    if (dollarFirst) {
      // Sort by total_amount descending (highest first)
      const amountDiff = b.total_amount - a.total_amount;
      if (amountDiff !== 0) {
        return amountDiff;
      }
      // For equal amounts, fall back to status and date ordering
      const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      // Default sorting: status first, then date
      const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
};

describe('Claims Sorting Logic', () => {
  describe('Dollar-First Prioritization', () => {
    it('should sort claims by highest amount first when dollarFirst is true', () => {
      const sortedClaims = sortClaimsWithDollarFirst(sampleClaims, true);
      
      // Verify the claims are sorted by amount in descending order
      const amounts = sortedClaims.map(claim => claim.total_amount);
      const expectedAmounts = [500.00, 400.00, 300.00, 200.00, 150.00, 120.00, 90.00, 75.00];
      
      expect(amounts).toEqual(expectedAmounts);
      
      // Verify the specific order by ID
      const claimIds = sortedClaims.map(claim => claim.id);
      expect(claimIds).toEqual(['5', '7', '2', '4', '1', '6', '8', '3']);
    });

    it('should fall back to status ordering for claims with equal amounts', () => {
      // Create claims with identical amounts but different statuses
      const equalAmountClaims = [
        createMockClaim('1', 'paid', 100.00),
        createMockClaim('2', 'needs_review', 100.00),
        createMockClaim('3', 'built', 100.00),
        createMockClaim('4', 'rejected_277ca', 100.00),
      ];

      const sortedClaims = sortClaimsWithDollarFirst(equalAmountClaims, true);
      
      // Should be ordered by STATUS_ORDER priority
      const statuses = sortedClaims.map(claim => claim.status);
      expect(statuses).toEqual(['needs_review', 'rejected_277ca', 'built', 'paid']);
    });

    it('should fall back to date ordering for claims with equal amounts and status', () => {
      // Create claims with identical amounts and status but different dates
      const equalAmountAndStatusClaims = [
        createMockClaim('1', 'needs_review', 100.00, '2024-01-01T08:00:00Z'),
        createMockClaim('2', 'needs_review', 100.00, '2024-01-01T10:00:00Z'),
        createMockClaim('3', 'needs_review', 100.00, '2024-01-01T09:00:00Z'),
      ];

      const sortedClaims = sortClaimsWithDollarFirst(equalAmountAndStatusClaims, true);
      
      // Should be ordered by most recent first (descending date order)
      const claimIds = sortedClaims.map(claim => claim.id);
      expect(claimIds).toEqual(['2', '3', '1']); // Most recent to oldest
    });
  });

  describe('Default Status-Date Ordering', () => {
    it('should sort claims by status order first when dollarFirst is false', () => {
      const sortedClaims = sortClaimsWithDollarFirst(sampleClaims, false);
      
      // Verify the claims are sorted by STATUS_ORDER
      const statuses = sortedClaims.map(claim => claim.status);
      const expectedStatusOrder = [
        'needs_review', 'needs_review', // Multiple needs_review items
        'rejected_277ca',
        'denied',
        'built',
        'submitted',
        'awaiting_277ca',
        'paid'
      ];
      
      expect(statuses).toEqual(expectedStatusOrder);
    });

    it('should sort claims with same status by most recent date first', () => {
      // Focus on the two needs_review claims which should be ordered by date
      const sortedClaims = sortClaimsWithDollarFirst(sampleClaims, false);
      const needsReviewClaims = sortedClaims.filter(claim => claim.status === 'needs_review');
      
      // Should be ordered by most recent first
      expect(needsReviewClaims[0].id).toBe('1'); // 2024-01-01T10:00:00Z
      expect(needsReviewClaims[1].id).toBe('5'); // 2024-01-01T08:00:00Z
    });

    it('should verify the known status order from STATUS_ORDER constant', () => {
      // Verify that STATUS_ORDER matches the expected priority
      const expectedStatusOrder: ClaimStatus[] = [
        'needs_review',
        'rejected_277ca', 
        'denied',
        'built',
        'submitted',
        'awaiting_277ca',
        'accepted_277ca',
        'paid'
      ];
      
      expect(STATUS_ORDER).toEqual(expectedStatusOrder);
    });
  });

  describe('Toggle Behavior Verification', () => {
    it('should return different orders when toggling dollarFirst on and off', () => {
      const dollarFirstSort = sortClaimsWithDollarFirst(sampleClaims, true);
      const statusFirstSort = sortClaimsWithDollarFirst(sampleClaims, false);
      
      // The orders should be different
      const dollarFirstIds = dollarFirstSort.map(claim => claim.id);
      const statusFirstIds = statusFirstSort.map(claim => claim.id);
      
      expect(dollarFirstIds).not.toEqual(statusFirstIds);
      
      // Verify specific expected orders
      expect(dollarFirstIds).toEqual(['5', '7', '2', '4', '1', '6', '8', '3']);
      expect(statusFirstIds).toEqual(['1', '5', '3', '7', '2', '6', '8', '4']);
    });

    it('should maintain consistent sorting when toggling back', () => {
      const originalDollarFirst = sortClaimsWithDollarFirst(sampleClaims, true);
      const statusFirst = sortClaimsWithDollarFirst(sampleClaims, false);
      const backToDollarFirst = sortClaimsWithDollarFirst(sampleClaims, true);
      
      // Should return to original dollar-first order
      expect(originalDollarFirst.map(c => c.id)).toEqual(backToDollarFirst.map(c => c.id));
    });
  });
});