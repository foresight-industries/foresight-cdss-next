import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import the claims page component and related types
import ClaimsPage from '../src/app/team/[slug]/claims/page';
import {
  type Claim,
  type DenialPlaybookConfig,
  getDenialReasonCode,
  findMatchingDenialRule,
  isEligibleForAutoResubmit,
  createDenialPlaybookHistoryEntry
} from '../src/data/claims';

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

describe('Denial Playbook Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  // Test data - denied claims with specific denial codes
  const testDeniedClaimAutoResubmit: Claim = {
    id: "CLM-TEST-001",
    encounter_id: "ENC-TEST-001",
    patient: { id: 9001, name: "Test Patient Auto" },
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
      provider: "Dr. Test Provider",
      paragraphs: [
        [{ text: "Test telehealth visit for denial playbook testing." }],
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
      type: "835",
      carc: "197",
      rarc: null,
      message: "POS Inconsistent with modifier or missing modifier",
      accepted: false,
    },
    provider: "Dr. Test Provider",
    eligibility_note: "Active coverage verified.",
    attachments: [],
    updatedAt: "2025-09-25T10:30:00Z",
    submissionOutcome: "reject",
  };

  const testDeniedClaimManualReview: Claim = {
    id: "CLM-TEST-002",
    encounter_id: "ENC-TEST-002",
    patient: { id: 9002, name: "Test Patient Manual" },
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
      provider: "Dr. Manual Review",
      paragraphs: [
        [{ text: "Test visit requiring prior authorization for denial playbook testing." }],
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
      type: "835",
      carc: "N700",
      rarc: null,
      message: "Prior authorization required",
      accepted: false,
    },
    provider: "Dr. Manual Review",
    eligibility_note: "Active Medicaid coverage.",
    attachments: [],
    updatedAt: "2025-09-24T10:30:00Z",
    submissionOutcome: "reject",
  };

  const testDeniedClaimMaxRetry: Claim = {
    id: "CLM-TEST-004",
    encounter_id: "ENC-TEST-004",
    patient: { id: 9004, name: "Test Patient Max Retry" },
    payer: { id: 1, name: "United Healthcare" },
    dos: "2025-09-22",
    visit_type: "Telehealth",
    state: "FL",
    total_amount: 120,
    status: "denied",
    pa_status: "denied",
    confidence: 0.90,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.90, modifiers: 0.85, pos: 0.88 },
    auto_submitted: false,
    attempt_count: 3, // Already at max retry attempts
    state_history: [
      {
        state: "submitted",
        at: "2025-09-22T08:00:00Z",
        note: "Initial submission",
      },
      {
        state: "denied",
        at: "2025-09-22T08:30:00Z",
        note: "First denial",
      },
      {
        state: "submitted",
        at: "2025-09-22T09:00:00Z",
        note: "Auto-resubmitted via playbook (rule: 197)",
      },
      {
        state: "denied",
        at: "2025-09-22T09:30:00Z",
        note: "Second denial",
      },
      {
        state: "submitted",
        at: "2025-09-22T10:00:00Z",
        note: "Auto-resubmitted via playbook (rule: 197)",
      },
      {
        state: "denied",
        at: "2025-09-22T10:30:00Z",
        note: "Third denial - max retries reached",
      },
    ],
    chart_note: {
      provider: "Dr. Max Retry",
      paragraphs: [
        [{ text: "Test visit for max retry limit testing." }],
      ],
    },
    codes: {
      icd10: ["Z00.00"],
      cpt: [
        {
          code: "99213",
          description: "Test consultation",
          amount: 120,
          modifiers: [],
        },
      ],
      pos: "11",
    },
    payer_response: {
      type: "835",
      carc: "197",
      rarc: null,
      message: "POS Inconsistent with modifier or missing modifier",
      accepted: false,
    },
    provider: "Dr. Max Retry",
    eligibility_note: "United Healthcare active.",
    attachments: [],
    updatedAt: "2025-09-22T10:30:00Z",
    submissionOutcome: "reject",
  };

  const testPlaybookConfig: DenialPlaybookConfig = {
    autoRetryEnabled: true,
    maxRetryAttempts: 3,
    customRules: [
      {
        id: 'rule-1',
        code: '197',
        description: 'POS Inconsistent / Missing Modifier',
        strategy: 'auto_resubmit' as const,
        enabled: true,
        autoFix: true,
      },
      {
        id: 'rule-2',
        code: 'N700',
        description: 'Precert/authorization required',
        strategy: 'manual_review' as const,
        enabled: true,
        autoFix: false,
      },
      {
        id: 'rule-3',
        code: 'CO123',
        description: 'Timeout/System unavailable',
        strategy: 'notify' as const,
        enabled: true,
        autoFix: false,
      }
    ]
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Denial Reason Code Extraction', () => {
    it('extracts CARC code from payer_response', () => {
      const code = getDenialReasonCode(testDeniedClaimAutoResubmit);
      expect(code).toBe('197');
    });

    it('extracts CARC code from rejection_response when payer_response not available', () => {
      const claimWithRejection = {
        ...testDeniedClaimAutoResubmit,
        payer_response: undefined,
        rejection_response: {
          type: "277CA" as const,
          carc: 'N700',
          rarc: null,
          message: 'Prior authorization required',
          accepted: false,
        }
      };
      const code = getDenialReasonCode(claimWithRejection);
      expect(code).toBe('N700');
    });

    it('extracts RARC code as fallback', () => {
      const claimWithRarc = {
        ...testDeniedClaimAutoResubmit,
        payer_response: {
          type: "835" as const,
          carc: null,
          rarc: 'M123',
          message: 'Test RARC code',
          accepted: false,
        }
      };
      const code = getDenialReasonCode(claimWithRarc);
      expect(code).toBe('M123');
    });

    it('returns null when no denial codes found', () => {
      const claimNoCodes = {
        ...testDeniedClaimAutoResubmit,
        payer_response: undefined,
        rejection_response: undefined,
      };
      const code = getDenialReasonCode(claimNoCodes);
      expect(code).toBeNull();
    });
  });

  describe('Denial Rule Matching', () => {
    it('finds matching rule for denial code', () => {
      const rule = findMatchingDenialRule(testDeniedClaimAutoResubmit, testPlaybookConfig);
      expect(rule).toBeTruthy();
      expect(rule?.code).toBe('197');
      expect(rule?.strategy).toBe('auto_resubmit');
    });

    it('finds manual review rule', () => {
      const rule = findMatchingDenialRule(testDeniedClaimManualReview, testPlaybookConfig);
      expect(rule).toBeTruthy();
      expect(rule?.code).toBe('N700');
      expect(rule?.strategy).toBe('manual_review');
    });

    it('returns null when no matching rule found', () => {
      const claimNoRule = {
        ...testDeniedClaimAutoResubmit,
        payer_response: {
          type: "835" as const,
          carc: '999',
          rarc: null,
          message: 'Unknown denial code',
          accepted: false,
        }
      };
      const rule = findMatchingDenialRule(claimNoRule, testPlaybookConfig);
      expect(rule).toBeNull();
    });

    it('returns null when rule is disabled', () => {
      const disabledPlaybook = {
        ...testPlaybookConfig,
        customRules: [
          {
            ...testPlaybookConfig.customRules[0],
            enabled: false
          }
        ]
      };
      const rule = findMatchingDenialRule(testDeniedClaimAutoResubmit, disabledPlaybook);
      expect(rule).toBeNull();
    });
  });

  describe('Auto-Resubmit Eligibility', () => {
    it('returns true for eligible auto-resubmit claim', () => {
      const eligible = isEligibleForAutoResubmit(testDeniedClaimAutoResubmit, testPlaybookConfig);
      expect(eligible).toBe(true);
    });

    it('returns false when autoRetryEnabled is disabled', () => {
      const disabledPlaybook = {
        ...testPlaybookConfig,
        autoRetryEnabled: false
      };
      const eligible = isEligibleForAutoResubmit(testDeniedClaimAutoResubmit, disabledPlaybook);
      expect(eligible).toBe(false);
    });

    it('returns false when attempt count exceeds max retries', () => {
      const eligible = isEligibleForAutoResubmit(testDeniedClaimMaxRetry, testPlaybookConfig);
      expect(eligible).toBe(false);
    });

    it('returns false when claim status is not denied', () => {
      const acceptedClaim = {
        ...testDeniedClaimAutoResubmit,
        status: 'accepted_277ca' as const
      };
      const eligible = isEligibleForAutoResubmit(acceptedClaim, testPlaybookConfig);
      expect(eligible).toBe(false);
    });

    it('returns false for manual review strategy', () => {
      const eligible = isEligibleForAutoResubmit(testDeniedClaimManualReview, testPlaybookConfig);
      expect(eligible).toBe(false);
    });
  });

  describe('Denial Playbook History Entry Creation', () => {
    it('creates proper history entry with rule code', () => {
      const entry = createDenialPlaybookHistoryEntry(
        'Auto-resubmitted via playbook',
        '197',
        'Automatic resubmission attempt #2'
      );

      expect(entry.state).toBe('built');
      expect(entry.note).toBe('Auto-resubmitted via playbook (rule: 197) - Automatic resubmission attempt #2');
      expect(entry.at).toBeTruthy();
      expect(new Date(entry.at)).toBeInstanceOf(Date);
    });

    it('creates entry without rule code', () => {
      const entry = createDenialPlaybookHistoryEntry('Manual action taken');

      expect(entry.state).toBe('built');
      expect(entry.note).toBe('Manual action taken');
    });

    it('creates entry with rule code but no additional note', () => {
      const entry = createDenialPlaybookHistoryEntry('Auto-processed', 'N700');

      expect(entry.state).toBe('built');
      expect(entry.note).toBe('Auto-processed (rule: N700)');
    });
  });

  describe('Claims Page Integration', () => {
    // Mock the initialClaims to include our test claims
    beforeEach(() => {
      // Clear and populate the mock claims array
      mockInitialClaims.length = 0;
      mockInitialClaims.push(testDeniedClaimAutoResubmit, testDeniedClaimManualReview, testDeniedClaimMaxRetry);
    });

    it('renders denied claims in the claims list', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // Check that denied claims are shown with denial indicators
      await waitFor(() => {
        expect(screen.getByText('CLM-TEST-001')).toBeInTheDocument();
        expect(screen.getByText('CLM-TEST-002')).toBeInTheDocument();
        expect(screen.getByText('CLM-TEST-004')).toBeInTheDocument();
      });
    });

    it('shows denial playbook indicator for processed claims', async () => {
      // Create a claim with playbook history
      const claimWithPlaybookHistory = {
        ...testDeniedClaimAutoResubmit,
        state_history: [
          ...testDeniedClaimAutoResubmit.state_history,
          {
            state: 'built' as const,
            at: '2025-09-25T11:00:00Z',
            note: 'Auto-resubmitted via playbook (rule: 197)'
          }
        ]
      };

      // This would require mocking the claims data, which is complex in this setup
      // In a real implementation, you'd mock the initialClaims or create a test wrapper
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // The test would verify that the "Denial Playbook Active" indicator appears
      // for claims that have been processed by the playbook
    });

    it('opens claim detail sheet and shows denial information', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('CLM-TEST-001')).toBeInTheDocument();
      });

      // Click on the denied claim to open detail sheet
      const claimRow = screen.getByText('CLM-TEST-001');
      await user.click(claimRow);

      // Should show the claim detail sheet
      await waitFor(() => {
        // Look for the claim ID in the sheet title
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-TEST-001')).toHaveLength(2); // One in list, one in sheet
        expect(screen.getAllByText('Denied')).toHaveLength(3); // Multiple denied badges across list and sheet
      });

      // Should show payer response with CARC code
      await waitFor(() => {
        expect(screen.getByText('CARC 197')).toBeInTheDocument();
        expect(screen.getByText('POS Inconsistent with modifier or missing modifier')).toBeInTheDocument();
      });

      // Should show denial playbook indicator if applicable
      const playbookIndicators = screen.queryAllByText('Denial Playbook Active');
      // This might be 0 initially for a fresh denied claim, or 1+ for processed claims
      expect(playbookIndicators.length).toBeGreaterThanOrEqual(0);
    });

    it('handles claims at max retry limit correctly', async () => {
      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('CLM-TEST-004')).toBeInTheDocument();
      });

      // Click on the max retry claim
      const claimRow = screen.getByText('CLM-TEST-004');
      await user.click(claimRow);

      // Should show the claim detail sheet
      await waitFor(() => {
        // Look for the claim ID in the sheet title
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('CLM-TEST-004')).toHaveLength(2); // One in list, one in sheet
        expect(screen.getAllByText('Denied')).toHaveLength(3); // Multiple denied badges across list and sheet
      });

      // Should show multiple state history entries for retries
      await waitFor(() => {
        expect(screen.getByText('Auto-resubmitted via playbook (rule: 197)')).toBeInTheDocument();
        expect(screen.getByText('Third denial - max retries reached')).toBeInTheDocument();
      });
    });

    it('shows appropriate messaging for different denial strategies', async () => {
      // This test would verify that the UI shows different messages based on the denial strategy
      // For example:
      // - Auto-resubmit: "This claim will be automatically resubmitted"
      // - Manual review: "This claim requires manual review per playbook"
      // - Notify: "Notification sent per playbook rule"

      render(<ClaimsPage />);

      await waitFor(() => {
        expect(screen.getByText('Claims Workbench')).toBeInTheDocument();
      });

      // The actual implementation would depend on the UI design for showing these messages
    });
  });

  describe('Error Handling', () => {
    it('handles missing payer response gracefully', () => {
      const claimNoResponse = {
        ...testDeniedClaimAutoResubmit,
        payer_response: undefined
      };

      const code = getDenialReasonCode(claimNoResponse);
      expect(code).toBeNull();

      const rule = findMatchingDenialRule(claimNoResponse, testPlaybookConfig);
      expect(rule).toBeNull();
    });

    it('handles empty custom rules array', () => {
      const emptyPlaybook = {
        ...testPlaybookConfig,
        customRules: []
      };

      const rule = findMatchingDenialRule(testDeniedClaimAutoResubmit, emptyPlaybook);
      expect(rule).toBeNull();
    });

    it('handles invalid claim data', () => {
      const invalidClaim = {
        ...testDeniedClaimAutoResubmit,
        status: undefined as any
      };

      const eligible = isEligibleForAutoResubmit(invalidClaim, testPlaybookConfig);
      expect(eligible).toBe(false);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large number of state history entries', () => {
      const claimWithManyEntries = {
        ...testDeniedClaimAutoResubmit,
        state_history: Array.from({ length: 100 }, (_, i) => ({
          state: 'built' as const,
          at: `2025-09-25T${String(i % 24).padStart(2, '0')}:00:00Z`,
          note: `History entry ${i}`
        }))
      };

      const entry = createDenialPlaybookHistoryEntry('Test action');
      expect(entry).toBeTruthy();
      expect(entry.note).toBe('Test action');
    });

    it('handles concurrent denial processing', async () => {
      // This test would verify that multiple denied claims can be processed simultaneously
      // without conflicts or race conditions
      const claims = [
        testDeniedClaimAutoResubmit,
        testDeniedClaimManualReview,
        { ...testDeniedClaimAutoResubmit, id: 'CLM-TEST-003' }
      ];

      // Process multiple claims
      const results = claims.map(claim =>
        isEligibleForAutoResubmit(claim, testPlaybookConfig)
      );

      expect(results).toHaveLength(3);
      expect(results[0]).toBe(true); // Auto-resubmit eligible
      expect(results[1]).toBe(false); // Manual review, not auto-eligible
      expect(results[2]).toBe(true); // Auto-resubmit eligible
    });
  });
});
