import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Helper function to check if element exists
const isInDocument = (element: HTMLElement | null) => {
  return element !== null;
};


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
  
  // Define test claims inline to avoid hoisting issues
  const mockTestClaims = [
    {
      id: 'claim-1',
      encounter_id: 'enc-claim-1',
      patient: { id: 1, name: 'Test Patient 1' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 150.00,
      status: 'needs_review',
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
        cpt: [{ code: '99213', description: 'Office Visit', amount: 150.00 }],
        pos: '11'
      },
      provider: 'Dr. Test',
      updatedAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'claim-2',
      encounter_id: 'enc-claim-2',
      patient: { id: 2, name: 'Test Patient 2' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 500.00,
      status: 'needs_review',
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
        cpt: [{ code: '99213', description: 'Office Visit', amount: 500.00 }],
        pos: '11'
      },
      provider: 'Dr. Test',
      updatedAt: new Date('2024-01-01T12:00:00Z')
    },
    {
      id: 'claim-3',
      encounter_id: 'enc-claim-3',
      patient: { id: 3, name: 'Test Patient 3' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 75.00,
      status: 'needs_review',
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
        cpt: [{ code: '99213', description: 'Office Visit', amount: 75.00 }],
        pos: '11'
      },
      provider: 'Dr. Test',
      updatedAt: new Date('2024-01-01T08:00:00Z')
    },
    {
      id: 'claim-4',
      encounter_id: 'enc-claim-4',
      patient: { id: 4, name: 'Test Patient 4' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 300.00,
      status: 'needs_review',
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
        cpt: [{ code: '99213', description: 'Office Visit', amount: 300.00 }],
        pos: '11'
      },
      provider: 'Dr. Test',
      updatedAt: new Date('2024-01-01T11:00:00Z')
    }
  ];
  
  return {
    ...originalModule,
    initialClaims: mockTestClaims,
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

    // Verify the toggle is initially unchecked (component starts with dollarFirst=false)
    const toggle = screen.getByRole('switch', { name: /high \$ first/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('should display claims in initial date-based order when component starts', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Verify toggle starts as unchecked (date-based mode active)
    const toggle = screen.getByRole('switch', { name: /high \$ first/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Get only the actual claim ID cells (not encounter IDs)
    const claimCells = screen.getAllByText(/^claim-\d+$/);

    // Expected order: most recent first (claim-2: 12:00, claim-4: 11:00, claim-1: 10:00, claim-3: 08:00)
    expect(claimCells[0].textContent).toBe('claim-2'); // 12:00 (most recent)
    expect(claimCells[1].textContent).toBe('claim-4'); // 11:00
    expect(claimCells[2].textContent).toBe('claim-1'); // 10:00
    expect(claimCells[3].textContent).toBe('claim-3'); // 08:00 (oldest)
  });

  it('should change claim order to dollar-first when High $ First toggle is turned on', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Find the High $ First toggle (starts as unchecked)
    const toggle = screen.getByRole('switch', { name: /high \$ first/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Click to turn on dollar-first mode
    fireEvent.click(toggle);

    // Verify the toggle is now checked
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Wait for the re-render after state change
    await waitFor(() => {
      // Get all claim ID cells after toggle
      const claimCells = screen.getAllByText(/^claim-\d+$/);

      // Expected order: highest amount first (claim-2: $500, claim-4: $300, claim-1: $150, claim-3: $75)
      expect(claimCells[0].textContent).toBe('claim-2'); // $500
      expect(claimCells[1].textContent).toBe('claim-4'); // $300
      expect(claimCells[2].textContent).toBe('claim-1'); // $150
      expect(claimCells[3].textContent).toBe('claim-3'); // $75
    });
  });

  it('should toggle between date-based and dollar-first ordering', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    const toggle = screen.getByRole('switch', { name: /high \$ first/i });

    // Initially starts with date-based mode active
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Verify initial date-based ordering
    await waitFor(() => {
      const claimCells = screen.getAllByText(/^claim-\d+$/);
      expect(claimCells[0].textContent).toBe('claim-2'); // 12:00 (most recent)
    });

    // Turn on dollar-first mode
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Wait for dollar-first ordering
    await waitFor(() => {
      const claimCells = screen.getAllByText(/^claim-\d+$/);

      // Should switch to dollar order: claim-2, claim-4, claim-1, claim-3
      expect(claimCells[0].textContent).toBe('claim-2'); // $500
      expect(claimCells[1].textContent).toBe('claim-4'); // $300
      expect(claimCells[2].textContent).toBe('claim-1'); // $150
      expect(claimCells[3].textContent).toBe('claim-3'); // $75
    });

    // Turn dollar-first back off
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Should return to date-based ordering
    await waitFor(() => {
      const claimCells = screen.getAllByText(/^claim-\d+$/);
      expect(claimCells[0].textContent).toBe('claim-2'); // 12:00 (most recent)
      expect(claimCells[1].textContent).toBe('claim-4'); // 11:00
      expect(claimCells[2].textContent).toBe('claim-1'); // 10:00
      expect(claimCells[3].textContent).toBe('claim-3'); // 08:00 (oldest)
    });
  });

  it('should show visual feedback when dollar-first mode is active', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    const toggle = screen.getByRole('switch', { name: /high \$ first/i }) as HTMLInputElement;

    // Initially should NOT show active state since component starts with dollarFirst=false
    expect(screen.queryByText('Active')).toBeNull();

    // Turn on dollar-first mode
    fireEvent.click(toggle);

    // Should show the active badge
    await waitFor(() => {
      expect(isInDocument(screen.getByText('Active'))).toBe(true);
    });

    // Should also show visual styling on the toggle container
    const toggleContainer = toggle.closest('[data-slot="tooltip-trigger"]');
    expect(toggleContainer?.classList.contains('border-primary/50')).toBe(true);

    // Turn off dollar-first mode
    fireEvent.click(toggle);

    // Should hide the active badge
    await waitFor(() => {
      expect(screen.queryByText('Active')).toBeNull();
    });

    // Should remove visual styling from the toggle container
    expect(toggleContainer?.classList.contains('border-border')).toBe(true);
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