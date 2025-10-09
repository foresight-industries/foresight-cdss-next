import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClaimsPage from '../src/app/team/[slug]/claims/page';
import type { Claim } from '../src/data/claims';

// Mock the claims data module
jest.mock('../src/data/claims', () => {
  const originalModule = jest.requireActual('../src/data/claims');
  
  // Create minimal test claims for keyboard navigation testing inside the mock
  const createTestClaim = (
    id: string,
    patientName: string,
    payerName: string,
    amount: number
  ) => ({
    id,
    encounter_id: `ENC-${id}`,
    patient: { id: parseInt(id.split('-')[1]), name: patientName },
    payer: { id: parseInt(id.split('-')[1]), name: payerName },
    total_amount: amount,
    status: 'built',
    dos: '2024-01-01',
    visit_type: 'Office Visit',
    state: 'CA',
    provider: 'Dr. Smith',
    confidence: 0.95,
    updatedAt: '2024-01-01T10:00:00Z',
    issues: [],
    suggested_fixes: [],
    codes: {
      icd10: ['Z00.00'],
      cpt: [{ code: '99213', description: 'Office visit', amount }],
      pos: '11'
    },
    validation_results: [],
    state_history: [],
    chart_note: { paragraphs: [[{ text: 'Test note', highlight: false }]], provider: 'Dr. Smith' },
    attempt_count: 1,
    member_id: `MEM${id.split('-')[1]}`,
    field_confidences: {},
    auto_submitted: false
  });
  
  const testClaims = [
    createTestClaim('CLAIM-001', 'John Doe', 'Test Payer 1', 150.00),
    createTestClaim('CLAIM-002', 'Jane Smith', 'Test Payer 2', 200.00),
    createTestClaim('CLAIM-003', 'Bob Wilson', 'Test Payer 3', 300.00)
  ];
  
  return {
    ...originalModule,
    initialClaims: testClaims,
    STATUS_LABELS: {
      'built': 'Built',
      'rejected_277ca': 'Rejected',
      'accepted_277ca': 'Accepted'
    },
    STATUS_BADGE_VARIANTS: {
      'built': '',
      'rejected_277ca': 'destructive',
      'accepted_277ca': 'default'
    },
    STATUS_FILTER_OPTIONS: [
      { value: 'built', label: 'Built' },
      { value: 'rejected_277ca', label: 'Rejected' }
    ],
    PA_STATUS_FILTER_OPTIONS: [],
    REVIEW_STATUSES: new Set(['rejected_277ca']),
    STATUS_ORDER: ['built', 'rejected_277ca', 'accepted_277ca'],
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    formatRelativeTime: (date: string) => 'Just now',
    getBlockingIssueCount: (claim: any) => claim.issues.filter((i: any) => i.severity === 'error').length,
    issueSummary: (claim: any) => 'Test summary',
    applyFixToClaim: (claim: any, fix: any, note: string) => claim,
    applyAllFixesToClaim: (claim: any) => claim
  };
});

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/team/test-team/claims'
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ slug: 'test-team' })
}));

describe('ClaimsPage - Keyboard Navigation', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    // Clean up any open modals/sheets by pressing Escape
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);
  });

  it('renders claims list with multiple items', () => {
    render(<ClaimsPage />);

    expect(screen.getByText('CLAIM-001')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-002')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-003')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('highlights first row when ArrowDown is pressed', async () => {
    render(<ClaimsPage />);

    // Press ArrowDown to focus first row
    await user.keyboard('{ArrowDown}');

    // Check that the first row has the focused class
    const firstRow = screen.getByText('CLAIM-001').closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');
    expect(firstRow).toHaveAttribute('aria-selected', 'true');
  });

  it('moves focus down through multiple rows and stops at last item', async () => {
    render(<ClaimsPage />);

    // Press ArrowDown to focus first row
    await user.keyboard('{ArrowDown}');
    const firstRow = screen.getByText('CLAIM-001').closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');

    // Press ArrowDown again to move to second row
    await user.keyboard('{ArrowDown}');
    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    expect(secondRow).toHaveClass('bg-muted/50');
    expect(firstRow).not.toHaveClass('bg-muted/50');

    // Press ArrowDown again to move to third row
    await user.keyboard('{ArrowDown}');
    const thirdRow = screen.getByText('CLAIM-003').closest('tr');
    expect(thirdRow).toHaveClass('bg-muted/50');
    expect(secondRow).not.toHaveClass('bg-muted/50');

    // Press ArrowDown again - should stay on third row (last item)
    await user.keyboard('{ArrowDown}');
    expect(thirdRow).toHaveClass('bg-muted/50');
  });

  it('moves focus up when ArrowUp is pressed', async () => {
    render(<ClaimsPage />);

    // First, move to second row
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    expect(secondRow).toHaveClass('bg-muted/50');

    // Press ArrowUp to move back to first row
    await user.keyboard('{ArrowUp}');
    const firstRow = screen.getByText('CLAIM-001').closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');
    expect(secondRow).not.toHaveClass('bg-muted/50');
  });

  it('opens claim detail when Enter is pressed on focused row', async () => {
    render(<ClaimsPage />);

    // Focus first row
    await user.keyboard('{ArrowDown}');

    // Press Enter to open detail
    await user.keyboard('{Enter}');

    // Check that the detail sheet is open (should find the claim ID in the sheet header)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens claim detail when "o" key is pressed on focused row', async () => {
    render(<ClaimsPage />);

    // Focus first row
    await user.keyboard('{ArrowDown}');

    // Press 'o' to open detail
    await user.keyboard('o');

    // Check that the detail sheet is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('navigates to next claim when ArrowDown is pressed in detail view', async () => {
    render(<ClaimsPage />);

    // Focus and open first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press ArrowDown to go to next claim
    await user.keyboard('{ArrowDown}');

    // The detail should now show the second claim (check in dialog specifically)
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('CLAIM-002');
    });
  });

  it('navigates to previous claim when ArrowUp is pressed in detail view', async () => {
    render(<ClaimsPage />);

    // Focus and open second claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press ArrowUp to go to previous claim
    await user.keyboard('{ArrowUp}');

    // The detail should now show the first claim (check in dialog specifically)
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('CLAIM-001');
    });
  });

  it('closes detail sheet and restores focus when Escape is pressed', async () => {
    render(<ClaimsPage />);

    // Focus and open second claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press Escape to close
    await user.keyboard('{Escape}');

    // Detail should be closed and focus should return to the second row
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    expect(secondRow).toHaveClass('bg-muted/50');
  });

  it('supports j/k keys for navigation (vim-style)', async () => {
    render(<ClaimsPage />);

    // Press 'j' to focus first row
    await user.keyboard('j');
    let firstRow = screen.getByText('CLAIM-001').closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');

    // Press 'j' again to move to second row
    await user.keyboard('j');
    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    expect(secondRow).toHaveClass('bg-muted/50');
    expect(firstRow).not.toHaveClass('bg-muted/50');

    // Press 'k' to move back to first row
    await user.keyboard('k');
    firstRow = screen.getByText('CLAIM-001').closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');
    expect(secondRow).not.toHaveClass('bg-muted/50');
  });

  it('does not trigger navigation when typing in search input', async () => {
    render(<ClaimsPage />);

    // Find and focus the search input
    const searchInput = screen.getByPlaceholderText(/Search patients, claims, encounters/);
    await user.click(searchInput);

    // Type some text that will keep all claims visible (part of "CLAIM" which all our claims have)
    await user.type(searchInput, 'CLA{ArrowDown}IM');

    // Verify that claims are still visible (search didn't filter them out)
    expect(screen.getByText('CLAIM-001')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-002')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-003')).toBeInTheDocument();

    // Verify that no row is focused (navigation was not triggered by ArrowDown in search input)
    const firstRow = screen.getByText('CLAIM-001').closest('tr');
    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    const thirdRow = screen.getByText('CLAIM-003').closest('tr');

    expect(firstRow).not.toHaveClass('bg-muted/50');
    expect(secondRow).not.toHaveClass('bg-muted/50');
    expect(thirdRow).not.toHaveClass('bg-muted/50');

    // Verify that the text was typed correctly (including the arrow key that should be ignored)
    expect(searchInput).toHaveValue('CLAIM');
  });

  it('does not trigger navigation when focused element is an input', async () => {
    render(<ClaimsPage />);

    // Find and focus the search input (which is an input element)
    const searchInput = screen.getByPlaceholderText(/Search patients, claims, encounters/);
    await user.click(searchInput);

    // Ensure input is focused
    expect(searchInput).toHaveFocus();

    // Type with arrow keys while input is focused - should not trigger navigation
    await user.keyboard('{ArrowDown}');

    // Verify that no row is focused (navigation was not triggered)
    const firstRow = screen.getByText('CLAIM-001').closest('tr');
    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    const thirdRow = screen.getByText('CLAIM-003').closest('tr');

    expect(firstRow).not.toHaveClass('bg-muted/50');
    expect(secondRow).not.toHaveClass('bg-muted/50');
    expect(thirdRow).not.toHaveClass('bg-muted/50');

    // Blur the input and then arrow keys should work
    await user.click(document.body);
    await user.keyboard('{ArrowDown}');

    // Now the first row should be focused
    expect(firstRow).toHaveClass('bg-muted/50');
  });

  it('handles ArrowUp from first position by going to last item', async () => {
    render(<ClaimsPage />);

    // Press ArrowUp from no selection - should go to last item
    await user.keyboard('{ArrowUp}');

    const lastRow = screen.getByText('CLAIM-003').closest('tr');
    expect(lastRow).toHaveClass('bg-muted/50');
  });

  it('resets focus when filtered claims change', async () => {
    render(<ClaimsPage />);

    // Focus second row
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    expect(secondRow).toHaveClass('bg-muted/50');

    // Apply a search filter that changes the filtered claims
    const searchInput = screen.getByPlaceholderText(/Search patients, claims, encounters/);
    await user.click(searchInput);
    await user.type(searchInput, 'CLAIM-001');

    // Wait for filter to apply and verify focus is reset
    await waitFor(() => {
      // Only CLAIM-001 should be visible now
      expect(screen.getByText('CLAIM-001')).toBeInTheDocument();
      expect(screen.queryByText('CLAIM-002')).not.toBeInTheDocument();
    });

    // The previously focused row should no longer have focus
    // (since the filtered claims changed and focus was reset)
    const visibleRow = screen.getByText('CLAIM-001').closest('tr');
    expect(visibleRow).not.toHaveClass('bg-muted/50');
  });

  it('maintains proper focus state when clicking on rows', async () => {
    render(<ClaimsPage />);

    // Click on the second row
    const secondRow = screen.getByText('CLAIM-002').closest('tr');
    await user.click(secondRow);

    // Should be focused and detail sheet should open
    expect(secondRow).toHaveClass('bg-muted/50');
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles upper case O key for opening claims', async () => {
    render(<ClaimsPage />);

    // Focus first row
    await user.keyboard('{ArrowDown}');

    // Press uppercase 'O' to open detail
    await user.keyboard('O');

    // Check that the detail sheet is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('does not navigate beyond boundaries', async () => {
    render(<ClaimsPage />);

    // Navigate to last item
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    const lastRow = screen.getByText('CLAIM-003').closest('tr');
    expect(lastRow).toHaveClass('bg-muted/50');

    // Try to go beyond last item
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    // Should still be on last item
    expect(lastRow).toHaveClass('bg-muted/50');

    // Navigate to first item
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowUp}');

    const firstRow = screen.getByText('CLAIM-001').closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');

    // Try to go beyond first item
    await user.keyboard('{ArrowUp}');

    // Should still be on first item
    expect(firstRow).toHaveClass('bg-muted/50');
  });
});
