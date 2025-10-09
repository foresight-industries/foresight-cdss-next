import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClaimsPage from '../src/app/team/[slug]/claims/page';

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

// Mock Next.js router
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

  // Define test claims inline with specific ordering for navigation testing
  const mockTestClaims = [
    {
      id: 'claim-first',
      encounter_id: 'enc-claim-first',
      patient: { id: 1, name: 'First Patient' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 100.00,
      status: 'needs_review',
      confidence: 0.95,
      issues: [],
      suggested_fixes: [{ field: 'test', value: 'fix', applied: false, confidence: 0.9, reason: 'test fix', label: 'Test Fix', provenance: 'rule' }],
      validation_results: [],
      field_confidences: {},
      auto_submitted: false,
      attempt_count: 1,
      state_history: [],
      chart_note: { provider: 'Dr. First', paragraphs: [[{ text: 'First claim note' }]] },
      codes: { icd10: ['Z00.00'], cpt: [{ code: '99213', description: 'Office Visit', amount: 100.00 }], pos: '11' },
      provider: 'Dr. First',
      updatedAt: '2024-01-01T12:00:00Z'
    },
    {
      id: 'claim-middle',
      encounter_id: 'enc-claim-middle',
      patient: { id: 2, name: 'Middle Patient' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 200.00,
      status: 'needs_review',
      confidence: 0.95,
      issues: [],
      suggested_fixes: [{ field: 'test', value: 'fix', applied: false, confidence: 0.9, reason: 'test fix', label: 'Test Fix', provenance: 'rule' }],
      validation_results: [],
      field_confidences: {},
      auto_submitted: false,
      attempt_count: 1,
      state_history: [],
      chart_note: { provider: 'Dr. Middle', paragraphs: [[{ text: 'Middle claim note' }]] },
      codes: { icd10: ['Z00.01'], cpt: [{ code: '99214', description: 'Office Visit', amount: 200.00 }], pos: '11' },
      provider: 'Dr. Middle',
      updatedAt: '2024-01-01T11:00:00Z'
    },
    {
      id: 'claim-last',
      encounter_id: 'enc-claim-last',
      patient: { id: 3, name: 'Last Patient' },
      payer: { id: 1, name: 'Test Insurance' },
      dos: '2024-01-01',
      visit_type: 'Office Visit',
      state: 'NY',
      total_amount: 300.00,
      status: 'needs_review',
      confidence: 0.95,
      issues: [],
      suggested_fixes: [{ field: 'test', value: 'fix', applied: false, confidence: 0.9, reason: 'test fix', label: 'Test Fix', provenance: 'rule' }],
      validation_results: [],
      field_confidences: {},
      auto_submitted: false,
      attempt_count: 1,
      state_history: [],
      chart_note: { provider: 'Dr. Last', paragraphs: [[{ text: 'Last claim note' }]] },
      codes: { icd10: ['Z00.02'], cpt: [{ code: '99215', description: 'Office Visit', amount: 300.00 }], pos: '11' },
      provider: 'Dr. Last',
      updatedAt: '2024-01-01T10:00:00Z'
    }
  ];

  return {
    ...originalModule,
    initialClaims: mockTestClaims,
    getBlockingIssueCount: (claim: any) => claim.issues.filter((i: any) => i.severity === 'fail').length,
    applyAllFixesToClaim: jest.fn((claim: any) => ({
      ...claim,
      suggested_fixes: claim.suggested_fixes.map((fix: any) => ({ ...fix, applied: true })),
      status: claim.issues.length === 0 ? 'built' : claim.status
    })),
  };
});

describe('ClaimsPage - Next/Previous Navigation', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any open modals/sheets
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);
  });

  it('should render claims page and open claim detail with navigation buttons', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Verify claims are rendered in expected order (sorted by updatedAt descending)
    expect(screen.getByText('claim-first')).toBeInTheDocument();
    expect(screen.getByText('claim-middle')).toBeInTheDocument();
    expect(screen.getByText('claim-last')).toBeInTheDocument();

    // Open the first claim detail by pressing ArrowDown then Enter
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Verify detail sheet is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify Next and Previous buttons are present
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });

    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();
  });

  it('should have correct button states when first claim is active', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // When first claim is active, Previous should be disabled, Next should be enabled
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Verify the first claim content is shown
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });
  });

  it('should navigate to next claim when Next button is clicked', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify we're showing the first claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });

    // Click Next button
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    await user.click(nextButton);

    // Verify we're now showing the middle claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });

    // Sheet should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should navigate to previous claim when Previous button is clicked', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the middle claim (second item)
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify we're showing the middle claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });

    // Click Previous button
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });
    await user.click(prevButton);

    // Verify we're now showing the first claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });

    // Sheet should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have correct button states when last claim is active', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Navigate to the last claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // When last claim is active, Next should be disabled, Previous should be enabled
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });

    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toBeDisabled();

    // Verify the last claim content is shown
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-last');
    });
  });

  it('should not navigate when clicking disabled Previous button at first claim', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify we're at the first claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });

    // Try to click the disabled Previous button
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });
    expect(prevButton).toBeDisabled();

    // Even if we try to click it, we should stay on the same claim
    await user.click(prevButton);

    // Should still be showing the first claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });
  });

  it('should not navigate when clicking disabled Next button at last claim', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Navigate to the last claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify we're at the last claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-last');
    });

    // Try to click the disabled Next button
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    expect(nextButton).toBeDisabled();

    // Even if we try to click it, we should stay on the same claim
    await user.click(nextButton);

    // Should still be showing the last claim
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-last');
    });
  });

  it('should maintain activeClaimId and keep sheet open when using Next/Previous buttons', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Navigate through claims using Next button
    const nextButton = screen.getByRole('button', { name: 'Next claim' });

    // Go to middle claim
    await user.click(nextButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Go to last claim
    await user.click(nextButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-last');
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Navigate back using Previous button
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });

    // Go back to middle claim
    await user.click(prevButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Go back to first claim
    await user.click(prevButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should maintain consistency between Next/Previous buttons and keyboard navigation', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Use Next button to go to middle claim
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    await user.click(nextButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });

    // Now use keyboard to go to next claim (should go to last claim)
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-last');
    });

    // Use keyboard to go back to middle claim
    await user.keyboard('{ArrowUp}');

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });

    // Use Previous button to go back to first claim
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });
    await user.click(prevButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-first');
    });

    // Both navigation methods should keep the state consistent
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should update button states correctly as navigation occurs', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    const prevButton = screen.getByRole('button', { name: 'Previous claim' });

    // At first claim: Prev disabled, Next enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Go to middle claim
    await user.click(nextButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });

    // At middle claim: Both buttons should be enabled
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Go to last claim
    await user.click(nextButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-last');
    });

    // At last claim: Next disabled, Prev enabled
    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toBeDisabled();
  });

  it('should maintain focus and highlight state when using Next/Previous buttons', async () => {
    render(<ClaimsPage />);

    await waitFor(() => {
      expect(isInDocument(screen.getByText('Work Queue'))).toBe(true);
    });

    // Focus and open the first claim
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find all rows that contain claim IDs
    const allFirstClaimElements = screen.getAllByText('claim-first');
    const firstRow = allFirstClaimElements.find(el => el.closest('tr'))?.closest('tr');
    expect(firstRow).toHaveClass('bg-muted/50');

    // Use Next button to navigate
    const nextButton = screen.getByRole('button', { name: 'Next claim' });
    await user.click(nextButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('claim-middle');
    });

    // Verify the focus has moved to the middle row
    const allMiddleClaimElements = screen.getAllByText('claim-middle');
    const middleRow = allMiddleClaimElements.find(el => el.closest('tr'))?.closest('tr');
    expect(middleRow).toHaveClass('bg-muted/50');
    expect(firstRow).not.toHaveClass('bg-muted/50');
  });
});
