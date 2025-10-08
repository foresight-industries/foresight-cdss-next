import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Claim, ClaimStatus } from '../src/data/claims';

// Helper function to check if element exists
const isInDocument = (element: HTMLElement | null) => {
  return element !== null;
};

// Create test claims with specific amounts and same status for controlled testing
const createTestClaim = (
  id: string,
  total_amount: number,
  status: ClaimStatus = 'needs_review',
  updatedAt: string = new Date().toISOString()
): Claim => ({
  id,
  encounter_id: `enc-${id}`,
  patient: { id: parseInt(id), name: `Test Patient ${id}` },
  payer: { id: 1, name: 'Test Insurance' },
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
    paragraphs: [[{ text: 'Test chart note' }]]
  },
  codes: {
    icd10: ['Z00.00'],
    cpt: [{ code: '99213', description: 'Office Visit', amount: total_amount }],
    pos: '11'
  },
  provider: 'Dr. Test',
  updatedAt
});

// Mock test claims with specific amounts and same status for controlled testing
const testClaims: Claim[] = [
  // All claims have same status (needs_review) so initial order is purely by updatedAt
  createTestClaim('claim-1', 150.00, 'needs_review', '2024-01-01T10:00:00Z'), // 2nd by date
  createTestClaim('claim-2', 500.00, 'needs_review', '2024-01-01T12:00:00Z'), // 1st by date (most recent)
  createTestClaim('claim-3', 75.00, 'needs_review', '2024-01-01T08:00:00Z'),  // 3rd by date (oldest)
  createTestClaim('claim-4', 300.00, 'needs_review', '2024-01-01T11:00:00Z'), // 2nd by date
];

// Mock the Sonner toast library
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js router since the component might use it
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    slug: 'test-team',
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the initialClaims import
jest.mock('../src/data/claims', () => {
  const originalModule = jest.requireActual('../src/data/claims');
  return {
    ...originalModule,
    initialClaims: testClaims,
  };
});

import ClaimsPage from '../src/app/team/[slug]/claims/page';

describe('ClaimsPage - High $ First Toggle', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should render the claims page with initial claims ordering', async () => {
    render(<ClaimsPage />);

    // Wait for the component to render
    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Verify the High $ First toggle is present
    expect(isInDocument(screen.getByLabelText('High $ first'))).toBe(true);

    // Verify the toggle is initially unchecked
    const toggle = screen.getByRole('switch', { name: /high \$ first/i }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
  });

  it('should display claims in initial date-based order (status->date) when dollarFirst is false', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Get all claim ID cells (they should be in date order since all have same status)
    const claimCells = screen.getAllByText(/claim-\d+/);

    // Expected order: most recent first (claim-2, claim-4, claim-1, claim-3)
    expect(claimCells[0].textContent?.includes('claim-2')).toBe(true); // $500, 12:00 (most recent)
    expect(claimCells[1].textContent?.includes('claim-4')).toBe(true); // $300, 11:00
    expect(claimCells[2].textContent?.includes('claim-1')).toBe(true); // $150, 10:00
    expect(claimCells[3].textContent?.includes('claim-3')).toBe(true); // $75, 08:00 (oldest)
  });

  it('should change claim order to dollar-first when High $ First toggle is clicked', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Find and click the High $ First toggle
    const toggle = screen.getByRole('switch', { name: /high \$ first/i }) as HTMLInputElement;

    fireEvent.click(toggle);

    // Verify the toggle is now checked
    expect(toggle.checked).toBe(true);

    // Wait for the re-render after state change
    await waitFor(() => {
      // Get all claim ID cells after toggle
      const claimCells = screen.getAllByText(/claim-\d+/);

      // Expected order: highest amount first (claim-2: $500, claim-4: $300, claim-1: $150, claim-3: $75)
      expect(claimCells[0].textContent?.includes('claim-2')).toBe(true); // $500
      expect(claimCells[1].textContent?.includes('claim-4')).toBe(true); // $300
      expect(claimCells[2].textContent?.includes('claim-1')).toBe(true); // $150
      expect(claimCells[3].textContent?.includes('claim-3')).toBe(true); // $75
    });
  });

  it('should restore original order when High $ First toggle is turned off', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    const toggle = screen.getByRole('switch', { name: /high \$ first/i }) as HTMLInputElement;

    // Turn on dollar-first mode
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);

    // Wait for dollar-first ordering
    await waitFor(() => {
      const claimCells = screen.getAllByText(/claim-\d+/);
      expect(claimCells[0].textContent?.includes('claim-2')).toBe(true); // $500 should be first
    });

    // Turn off dollar-first mode
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);

    // Wait for restoration to original order (date-based)
    await waitFor(() => {
      const claimCells = screen.getAllByText(/claim-\d+/);

      // Should return to date order: claim-2, claim-4, claim-1, claim-3
      expect(claimCells[0].textContent?.includes('claim-2')).toBe(true); // 12:00 (most recent)
      expect(claimCells[1].textContent?.includes('claim-4')).toBe(true); // 11:00
      expect(claimCells[2].textContent?.includes('claim-1')).toBe(true); // 10:00
      expect(claimCells[3].textContent?.includes('claim-3')).toBe(true); // 08:00 (oldest)
    });
  });

  it('should show visual feedback when dollar-first mode is active', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    const toggle = screen.getByRole('switch', { name: /high \$ first/i }) as HTMLInputElement;

    // Initially should not show active state
    expect(screen.queryByText('Active')).toBeNull();

    // Turn on dollar-first mode
    fireEvent.click(toggle);

    // Should show the active badge
    await waitFor(() => {
      expect(isInDocument(screen.getByText('Active'))).toBe(true);
    });

    // Should also show visual styling on the toggle container
    const toggleContainer = toggle.closest('[class*="border"]');
    expect(toggleContainer?.classList.contains('border-primary/50')).toBe(true);
  });

  it('should maintain dollar-first sorting with correct amounts displayed', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    const toggle = screen.getByRole('switch', { name: /high \$ first/i }) as HTMLInputElement;
    fireEvent.click(toggle);

    await waitFor(() => {
      // Verify that amounts are displayed correctly in dollar-first order
      const amountCells = screen.getAllByText(/\$\d+/);

      // Should be in descending order: $500, $300, $150, $75
      expect(amountCells[0].textContent?.includes('$500')).toBe(true);
      expect(amountCells[1].textContent?.includes('$300')).toBe(true);
      expect(amountCells[2].textContent?.includes('$150')).toBe(true);
      expect(amountCells[3].textContent?.includes('$75')).toBe(true);
    });
  });
});