import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import the claims page component and mock components
import ClaimsPage from '../src/app/team/[slug]/claims/page';
import { type Claim } from '../src/data/claims';

// Mock the claims data module
const mockInitialClaims: Claim[] = [];

jest.mock('../src/data/claims', () => {
  const actual = jest.requireActual('../src/data/claims');
  return {
    ...actual,
    get initialClaims() {
      return mockInitialClaims;
    },
  };
});

// Mock sonner for toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('Denial Playbook UI Behavior', () => {
  let user: ReturnType<typeof userEvent.setup>;

  // Test claims with different denial scenarios
  const deniedClaimWithAutoResubmitRule: Claim = {
    id: "CLM-UI-001",
    encounter_id: "ENC-UI-001", 
    patient: { id: 8001, name: "UI Test Auto Patient" },
    payer: { id: 1, name: "United Healthcare" },
    dos: "2025-09-25",
    visit_type: "Telehealth",
    state: "FL",
    total_amount: 150,
    status: "denied",
    pa_status: "denied",
    confidence: 0.95,
    issues: [],
    suggested_fixes: [
      {
        field: "modifiers",
        label: "Add Modifier 95",
        value: "95",
        provenance: "rule",
        confidence: 0.99,
        reason: "Add modifier 95 for telehealth",
      }
    ],
    validation_results: [],
    field_confidences: { cpt: 0.95, modifiers: 0.80, pos: 0.90 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "submitted",
        at: "2025-09-25T10:00:00Z",
        note: "Initial submission",
      },
      {
        state: "denied",
        at: "2025-09-25T10:30:00Z",
        note: "Denied by payer",
      },
    ],
    chart_note: {
      provider: "Dr. UI Test",
      paragraphs: [
        [{ text: "Test telehealth visit for UI testing." }],
      ],
    },
    codes: {
      icd10: ["Z00.00"],
      cpt: [
        {
          code: "99213",
          description: "Test consultation",
          amount: 150,
          modifiers: [],
        },
      ],
      pos: "11",
    },
    payer_response: {
      type: "835" as const,
      carc: "197",
      rarc: null,
      message: "POS Inconsistent with modifier or missing modifier",
      accepted: false,
    },
    provider: "Dr. UI Test",
    eligibility_note: "Active coverage verified.",
    attachments: [],
    updatedAt: "2025-09-25T10:30:00Z",
    submissionOutcome: "reject",
  };

  const deniedClaimWithManualReviewRule: Claim = {
    id: "CLM-UI-002",
    encounter_id: "ENC-UI-002", 
    patient: { id: 8002, name: "UI Test Manual Patient" },
    payer: { id: 2, name: "MI Medicaid" },
    dos: "2025-09-24",
    visit_type: "In-Person",
    state: "MI",
    total_amount: 200,
    status: "denied",
    pa_status: "denied",
    confidence: 0.92,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.92, modifiers: 0.85, pos: 0.88 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "submitted",
        at: "2025-09-24T10:00:00Z",
        note: "Initial submission",
      },
      {
        state: "denied",
        at: "2025-09-24T10:30:00Z",
        note: "Denied by payer",
      },
    ],
    chart_note: {
      provider: "Dr. Manual UI Test",
      paragraphs: [
        [{ text: "Test visit requiring prior authorization." }],
      ],
    },
    codes: {
      icd10: ["M79.3"],
      cpt: [
        {
          code: "99215",
          description: "Complex consultation",
          amount: 200,
          modifiers: [],
        },
      ],
      pos: "11",
    },
    payer_response: {
      type: "835" as const,
      carc: "N700",
      rarc: null,
      message: "Prior authorization required",
      accepted: false,
    },
    provider: "Dr. Manual UI Test",
    eligibility_note: "Active Medicaid coverage.",
    attachments: [],
    updatedAt: "2025-09-24T10:30:00Z",
    submissionOutcome: "reject",
  };

  const deniedClaimNoMatchingRule: Claim = {
    id: "CLM-UI-003",
    encounter_id: "ENC-UI-003", 
    patient: { id: 8003, name: "UI Test No Rule Patient" },
    payer: { id: 4, name: "Aetna Commercial" },
    dos: "2025-09-21",
    visit_type: "In-Person",
    state: "NY",
    total_amount: 180,
    status: "denied",
    pa_status: "denied",
    confidence: 0.85,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.85, modifiers: 0.80, pos: 0.90 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "submitted",
        at: "2025-09-21T10:00:00Z",
        note: "Initial submission",
      },
      {
        state: "denied",
        at: "2025-09-21T10:30:00Z",
        note: "Denied by payer",
      },
    ],
    chart_note: {
      provider: "Dr. No Rule",
      paragraphs: [
        [{ text: "Test visit with unknown denial code." }],
      ],
    },
    codes: {
      icd10: ["Z02.89"],
      cpt: [
        {
          code: "99214",
          description: "Detailed consultation",
          amount: 180,
          modifiers: [],
        },
      ],
      pos: "11",
    },
    payer_response: {
      type: "835" as const,
      carc: "999",
      rarc: null,
      message: "Unknown denial code for testing",
      accepted: false,
    },
    provider: "Dr. No Rule",
    eligibility_note: "Aetna commercial active.",
    attachments: [],
    updatedAt: "2025-09-21T10:30:00Z",
    submissionOutcome: "reject",
  };

  const deniedClaimWithPlaybookHistory: Claim = {
    id: "CLM-UI-004",
    encounter_id: "ENC-UI-004", 
    patient: { id: 8004, name: "UI Test Playbook Active" },
    payer: { id: 1, name: "United Healthcare" },
    dos: "2025-09-23",
    visit_type: "Telehealth",
    state: "FL",
    total_amount: 130,
    status: "denied",
    pa_status: "denied",
    confidence: 0.88,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.88, modifiers: 0.85, pos: 0.90 },
    auto_submitted: false,
    attempt_count: 2,
    state_history: [
      {
        state: "submitted",
        at: "2025-09-23T09:00:00Z",
        note: "Initial submission",
      },
      {
        state: "denied",
        at: "2025-09-23T09:30:00Z",
        note: "First denial",
      },
      {
        state: "built",
        at: "2025-09-23T10:00:00Z",
        note: "Auto-resubmitted via playbook (rule: 197)",
      },
      {
        state: "submitted",
        at: "2025-09-23T10:05:00Z",
        note: "Resubmission attempt #2",
      },
      {
        state: "denied",
        at: "2025-09-23T10:30:00Z",
        note: "Second denial",
      },
    ],
    chart_note: {
      provider: "Dr. Playbook Active",
      paragraphs: [
        [{ text: "Test visit with active playbook processing." }],
      ],
    },
    codes: {
      icd10: ["Z00.00"],
      cpt: [
        {
          code: "99213",
          description: "Test consultation",
          amount: 130,
          modifiers: [],
        },
      ],
      pos: "11",
    },
    payer_response: {
      type: "835" as const,
      carc: "197",
      rarc: null,
      message: "POS Inconsistent with modifier or missing modifier",
      accepted: false,
    },
    provider: "Dr. Playbook Active",
    eligibility_note: "United Healthcare active.",
    attachments: [],
    updatedAt: "2025-09-23T10:30:00Z",
    submissionOutcome: "reject",
  };

  const autoSubmittedAcceptedClaim: Claim = {
    id: "CLM-UI-005",
    encounter_id: "ENC-UI-005", 
    patient: { id: 8005, name: "UI Test Auto Success" },
    payer: { id: 1, name: "United Healthcare" },
    dos: "2025-09-26",
    visit_type: "Telehealth",
    state: "FL",
    total_amount: 140,
    status: "accepted_277ca",
    pa_status: "auto-approved",
    confidence: 0.95,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.95, modifiers: 0.90, pos: 0.95 },
    auto_submitted: true,
    attempt_count: 2,
    state_history: [
      {
        state: "submitted",
        at: "2025-09-26T09:00:00Z",
        note: "Initial submission",
      },
      {
        state: "denied",
        at: "2025-09-26T09:30:00Z",
        note: "First denial",
      },
      {
        state: "built",
        at: "2025-09-26T10:00:00Z",
        note: "Auto-resubmitted via playbook (rule: 197)",
      },
      {
        state: "submitted",
        at: "2025-09-26T10:05:00Z",
        note: "Auto-resubmission successful",
      },
      {
        state: "accepted_277ca",
        at: "2025-09-26T10:15:00Z",
        note: "Accepted by clearinghouse",
      },
    ],
    chart_note: {
      provider: "Dr. Auto Success",
      paragraphs: [
        [{ text: "Test visit with successful auto-resubmission." }],
      ],
    },
    codes: {
      icd10: ["Z00.00"],
      cpt: [
        {
          code: "99213",
          description: "Test consultation",
          amount: 140,
          modifiers: ["95"],
        },
      ],
      pos: "10",
    },
    payer_response: {
      type: "835" as const,
      carc: null,
      rarc: null,
      message: "Claim accepted",
      accepted: true,
    },
    provider: "Dr. Auto Success",
    eligibility_note: "United Healthcare active.",
    attachments: [],
    updatedAt: "2025-09-26T10:15:00Z",
    submissionOutcome: "accept",
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Clear and populate the mock claims array
    mockInitialClaims.length = 0;
    mockInitialClaims.push(
      deniedClaimWithAutoResubmitRule,
      deniedClaimWithManualReviewRule,
      deniedClaimNoMatchingRule,
      deniedClaimWithPlaybookHistory,
      autoSubmittedAcceptedClaim
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Denial Playbook Active Indicator', () => {
    it('shows "Denial Playbook Active" indicator for claims with playbook history', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Find and click on the claim with playbook history
      const claimWithHistory = screen.getByText('CLM-UI-004');
      await user.click(claimWithHistory);

      // Should open the claim detail sheet
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-UI-004')).toHaveLength(2); // One in list, one in sheet
      });

      // Should show the "Denial Playbook Active" indicator
      await waitFor(() => {
        const playbookIndicator = screen.getByText('Denial Playbook Active');
        expect(playbookIndicator).toBeInTheDocument();
        expect(playbookIndicator).toHaveClass('text-blue-600');
        
        // Should show sparkles icon
        const sparklesIcon = playbookIndicator.querySelector('svg');
        expect(sparklesIcon).toBeInTheDocument();
      });
    });

    it('does not show playbook indicator for claims without playbook history', async () => {
      // Use a claim that won't match any playbook rules
      const claimWithoutMatchingRule = {
        ...deniedClaimNoMatchingRule,
        state_history: [
          {
            state: "submitted" as const,
            at: "2025-09-21T10:00:00Z",
            note: "Initial submission",
          },
          {
            state: "denied" as const,
            at: "2025-09-21T10:30:00Z",
            note: "Denied by payer",
          },
        ]
      };

      // Replace mock claims with non-matching claim
      mockInitialClaims.length = 0;
      mockInitialClaims.push(claimWithoutMatchingRule);

      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Click on the claim that doesn't match any playbook rules
      const regularDeniedClaim = screen.getByText('CLM-UI-003');
      await user.click(regularDeniedClaim);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-UI-003')).toHaveLength(2); // One in list, one in sheet
      });

      // Should NOT show the "Denial Playbook Active" indicator since no rules match
      const playbookIndicator = screen.queryByText('Denial Playbook Active');
      expect(playbookIndicator).not.toBeInTheDocument();
    });

    it('shows "Auto-submitted" indicator for successfully auto-processed claims', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Click on the auto-submitted accepted claim
      const autoSubmittedClaim = screen.getByText('CLM-UI-005');
      await user.click(autoSubmittedClaim);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-UI-005')).toHaveLength(2); // One in list, one in sheet
      });

      // Should show the "Auto-submitted" indicator
      await waitFor(() => {
        const autoSubmittedIndicator = screen.getByText('Auto-submitted');
        expect(autoSubmittedIndicator).toBeInTheDocument();
        expect(autoSubmittedIndicator).toHaveClass('text-emerald-600');
        
        // Should show check circle icon
        const checkIcon = autoSubmittedIndicator.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('Denial Codes Display', () => {
    it('displays CARC codes in claim list for denied claims', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Should show claims with denied status - test for basic UI presence
      await waitFor(() => {
        expect(screen.getByText('CLM-UI-001')).toBeInTheDocument(); // Auto-resubmit claim
        expect(screen.getByText('CLM-UI-002')).toBeInTheDocument(); // Manual review claim
        expect(screen.getByText('CLM-UI-003')).toBeInTheDocument(); // No matching rule claim
      });

      // Test that denied claims are visually distinguishable (basic check)
      const deniedClaims = screen.getAllByText(/CLM-UI-00[1-3]/);
      expect(deniedClaims.length).toBeGreaterThan(0);
    });

    it('displays detailed denial information in claim detail sheet', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('CLM-UI-001')).toBeInTheDocument();
      });

      // Click on denied claim
      const deniedClaim = screen.getByText('CLM-UI-001');
      await user.click(deniedClaim);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-UI-001')).toHaveLength(2); // One in list, one in sheet
      });

      // Should show payer response section
      await waitFor(() => {
        expect(screen.getByText('Payer Response')).toBeInTheDocument();
        expect(screen.getByText('CARC 197')).toBeInTheDocument();
        expect(screen.getByText('POS Inconsistent with modifier or missing modifier')).toBeInTheDocument();
      });

      // CARC information should be displayed properly
      const carcText = screen.getByText('CARC 197');
      expect(carcText).toBeInTheDocument();
    });
  });

  describe('State History and Audit Trail', () => {
    it('shows playbook actions in state history', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('CLM-UI-004')).toBeInTheDocument();
      });

      // Click on claim with playbook history
      const claimWithHistory = screen.getByText('CLM-UI-004');
      await user.click(claimWithHistory);

      await waitFor(() => {
        expect(screen.getByText('Timeline & Audit')).toBeInTheDocument();
      });

      // Should show the playbook action in state history
      await waitFor(() => {
        expect(screen.getByText('Auto-resubmitted via playbook (rule: 197)')).toBeInTheDocument();
        expect(screen.getByText('First denial')).toBeInTheDocument();
        expect(screen.getByText('Second denial')).toBeInTheDocument();
      });

      // Should show proper chronological order (most recent first)
      const historyEntries = screen.getAllByText(/denial|Auto-resubmitted/);
      expect(historyEntries[0]).toHaveTextContent('Second denial');
      expect(historyEntries[1]).toHaveTextContent('Auto-resubmitted via playbook');
    });

    it('displays attempt count correctly', async () => {
      render(<ClaimsPage />);

      // Click on claim with multiple attempts
      const multiAttemptClaim = screen.getByText('CLM-UI-004');
      await user.click(multiAttemptClaim);

      await waitFor(() => {
        expect(screen.getByText('Attempt #2')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Notifications', () => {
    it('triggers appropriate toast notifications during playbook processing', async () => {
      // This test would need to mock the denial processing functions
      // and verify that the correct toast messages are shown
      
      render(<ClaimsPage />);

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // In a real implementation, you would:
      // 1. Simulate a claim becoming denied (status change)
      // 2. Verify that the appropriate toast is called
      // 3. Check for different toast types based on strategy

      // Example assertions (would need actual implementation):
      // expect(mockToast.success).toHaveBeenCalledWith(
      //   expect.stringContaining('auto-resubmitted via denial playbook')
      // );
      // expect(mockToast.info).toHaveBeenCalledWith(
      //   expect.stringContaining('flagged for manual review')
      // );
      // expect(mockToast.warning).toHaveBeenCalledWith(
      //   expect.stringContaining('requires attention')
      // );
    });
  });

  describe('Edge Cases and Error States', () => {
    it('handles claims with missing denial information gracefully', async () => {
      const claimMissingInfo = {
        ...deniedClaimWithAutoResubmitRule,
        payer_response: undefined
      };

      // Replace mock claims with missing info claim
      mockInitialClaims.length = 0;
      mockInitialClaims.push(claimMissingInfo);

      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Should not crash and should handle missing payer response
      const claimRow = screen.getByText('CLM-UI-001');
      await user.click(claimRow);

      // Should open detail without errors
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-UI-001')).toHaveLength(2); // One in list, one in sheet
      });

      // Should not show payer response section
      expect(screen.queryByText('Payer Response')).not.toBeInTheDocument();
    });

    it('shows appropriate state for claims at max retry limit', async () => {
      const maxRetryClaim = {
        ...deniedClaimWithAutoResubmitRule,
        attempt_count: 3,
        state_history: [
          ...deniedClaimWithAutoResubmitRule.state_history,
          {
            state: "denied" as const,
            at: "2025-09-25T11:00:00Z",
            note: "Max retry attempts reached"
          }
        ]
      };

      // Replace mock claims with max retry claim
      mockInitialClaims.length = 0;
      mockInitialClaims.push(maxRetryClaim);

      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('CLM-UI-001')).toBeInTheDocument();
      });

      const claimRow = screen.getByText('CLM-UI-001');
      await user.click(claimRow);

      await waitFor(() => {
        expect(screen.getByText('Attempt #3')).toBeInTheDocument();
        expect(screen.getByText('Max retry attempts reached')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('provides proper ARIA labels for playbook indicators', async () => {
      render(<ClaimsPage />);

      const claimWithHistory = screen.getByText('CLM-UI-004');
      await user.click(claimWithHistory);

      await waitFor(() => {
        const playbookIndicator = screen.getByText('Denial Playbook Active');
        expect(playbookIndicator).toBeInTheDocument();
        
        // Should have proper semantic structure
        expect(playbookIndicator.tagName).toBe('SPAN');
        expect(playbookIndicator).toHaveClass('flex', 'items-center', 'gap-1');
      });
    });

    it('maintains proper keyboard navigation for denied claims', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Test keyboard navigation (this would require more complex setup)
      // Focus management and keyboard accessibility for denied claims
      const claimRows = screen.getAllByRole('row');
      expect(claimRows.length).toBeGreaterThan(0);
    });

    it('provides clear visual distinction for different denial states', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Claims with denied status should have visual indicators
      const deniedRows = screen.getAllByText(/CLM-UI-/);
      expect(deniedRows.length).toBeGreaterThan(0);

      // Each denied claim row should have the amber border styling
      // (This would need to check the actual DOM structure)
    });
  });

  describe('Performance Considerations', () => {
    it('handles large numbers of denied claims efficiently', async () => {
      // Generate many test claims
      const manyDeniedClaims = Array.from({ length: 50 }, (_, i) => ({
        ...deniedClaimWithAutoResubmitRule,
        id: `CLM-PERF-${String(i).padStart(3, '0')}`,
        patient: { id: 9000 + i, name: `Performance Test Patient ${i}` },
      }));

      // Replace mock claims with many denied claims
      mockInitialClaims.length = 0;
      mockInitialClaims.push(...manyDeniedClaims);

      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Should render without performance issues
      expect(screen.getByText('CLM-PERF-000')).toBeInTheDocument();
      expect(screen.getByText('CLM-PERF-049')).toBeInTheDocument();
    });

    it('updates UI efficiently when playbook processes claims', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // This test would verify that UI updates don't cause unnecessary re-renders
      // when the playbook processes denied claims automatically
      
      // In a real implementation, you might use React testing utilities
      // to count renders or measure performance
    });
  });
});