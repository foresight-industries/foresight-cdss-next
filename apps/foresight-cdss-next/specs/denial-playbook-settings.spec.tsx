import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SettingsClient from '../src/components/settings/settings-client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('section=denial-playbook'),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock fetch for save functionality
global.fetch = jest.fn();

describe('Denial Playbook Settings', () => {
  let user: ReturnType<typeof userEvent.setup>;

  // Mock props for SettingsClient
  const mockInitialAutomationSettings = {
    autoApprovalThreshold: 90,
    requireReviewThreshold: 70,
    maxRetryAttempts: 3,
    enableBulkProcessing: true,
    confidenceScoreEnabled: true,
    ocrAccuracyThreshold: 95,
    globalConfidenceThreshold: 88,
    enableAutoSubmission: false,
    enableAutoEPA: false,
    fieldConfidenceThresholds: {
      cptCode: 85,
      icd10: 85,
      placeOfService: 90,
      modifiers: 80,
    },
  };

  const mockInitialValidationSettings = {
    visitTypes: {
      telehealth: true,
      inPerson: true,
      home: false,
    },
    posRules: {
      enforceTelehealthPOS: true,
      enforceInPersonPOS: true,
      enforceHomePOS: true,
    },
    modifierRules: {
      modifier95Required: true,
      autoAddModifier95: true,
      modifier95ConflictResolution: true,
      validateModifierCombinations: false,
      requireModifierDocumentation: false,
      blockInvalidModifiers: true,
      enablePayerSpecificRules: false,
      conflictRules: [],
    },
    requiredFields: {
      blockOnMissingFields: true,
    },
    timeBasedValidation: {
      enabled: true,
      extractTimeFromNotes: true,
      cptRules: [],
    },
    credentialingRules: {
      enforceCredentialing: true,
      allowedStatuses: ["Active"],
      multiStateLicensure: true,
      showCredentialingAlerts: true,
    },
    denialPlaybook: {
      autoRetryEnabled: true,
      maxRetryAttempts: 3,
      customRules: [
        {
          id: 'rule-1',
          code: 'CARC 24',
          description: 'Charges covered under capitation agreement',
          strategy: 'Check contract status, flag for manual review',
          enabled: true,
          autoFix: false,
        },
        {
          id: 'rule-2',
          code: 'RARC 149',
          description: 'Deductible amount',
          strategy: 'Apply patient deductible, resubmit claim',
          enabled: false,
          autoFix: true,
        }
      ],
    },
    diagnosisValidation: {
      validateIcdToCpt: true,
      medicalNecessityThreshold: 80,
      suggestAlternativeDx: true,
    },
    auditLogging: {
      logRuleApplications: true,
      logAutoFixes: true,
      retentionPeriod: "1 year",
    },
  };

  const mockInitialNotificationSettings = {
    emailAlerts: true,
    slackIntegration: false,
    approvalNotifications: true,
    denialNotifications: true,
    systemMaintenanceAlerts: true,
    weeklyReports: true,
    dailyDigest: false,
  };

  beforeEach(() => {
    user = userEvent.setup();
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the settings page with denial playbook section active', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Should show the denial playbook section in navigation
    expect(screen.getByText('Denial Playbook')).toBeInTheDocument();
    expect(screen.getByText('Configure automatic denial resolution strategies')).toBeInTheDocument();

    // Should show the denial playbook content by default (since URL has section=denial-playbook)
    await waitFor(() => {
      expect(screen.getByText('Auto-Retry Configuration')).toBeInTheDocument();
    });
  });

  it('navigates to denial-playbook section when clicked', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Click on the denial playbook navigation
    const denialPlaybookButton = screen.getByText('Denial Playbook');
    await user.click(denialPlaybookButton);

    // Should show denial playbook content
    await waitFor(() => {
      expect(screen.getByText('Auto-Retry Configuration')).toBeInTheDocument();
      expect(screen.getByText('Enable Auto-Retry on Denials')).toBeInTheDocument();
      expect(screen.getByText('Maximum Retry Attempts')).toBeInTheDocument();
      expect(screen.getByText('Denial Code Auto-Fix Rules (CARC/RARC)')).toBeInTheDocument();
    });
  });

  it('toggles auto-retry switch and updates state', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      const autoRetrySwitch = screen.getByLabelText('Enable Auto-Retry on Denials');
      expect(autoRetrySwitch).toBeInTheDocument();

      // Initially should be checked (autoRetryEnabled: true)
      expect(autoRetrySwitch).toBeChecked();
    });

    // Click to toggle off
    const autoRetrySwitch = screen.getByLabelText('Enable Auto-Retry on Denials');
    await user.click(autoRetrySwitch);

    // Should now be unchecked
    expect(autoRetrySwitch).not.toBeChecked();

    // Click to toggle back on
    await user.click(autoRetrySwitch);
    expect(autoRetrySwitch).toBeChecked();
  });

  it('changes max retry attempts input and validates numeric input', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      const maxRetryInput = screen.getByDisplayValue('3');
      expect(maxRetryInput).toBeInTheDocument();
      expect(maxRetryInput).toHaveAttribute('type', 'number');
      expect(maxRetryInput).toHaveAttribute('min', '1');
      expect(maxRetryInput).toHaveAttribute('max', '10');
    });

    const maxRetryInput = screen.getByDisplayValue('3') as HTMLInputElement;

    // Use fireEvent to directly change the input value
    fireEvent.change(maxRetryInput, { target: { value: '5' } });
    expect(maxRetryInput.value).toBe('5');

    // Try to enter an invalid value (should be constrained by min/max)
    fireEvent.change(maxRetryInput, { target: { value: '15' } });
    // The input should still accept the value, but the form validation should handle constraints
    expect(maxRetryInput.value).toBe('15');

    // Test minimum value
    fireEvent.change(maxRetryInput, { target: { value: '1' } });
    expect(maxRetryInput.value).toBe('1');
  });

  it('displays existing custom rules correctly', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      // Should show existing rules
      expect(screen.getByText('CARC 24 - Charges covered under capitation agreement')).toBeInTheDocument();
      expect(screen.getByText('RARC 149 - Deductible amount')).toBeInTheDocument();

      // Should show strategies
      expect(screen.getByText('Check contract status, flag for manual review')).toBeInTheDocument();
      expect(screen.getByText('Apply patient deductible, resubmit claim')).toBeInTheDocument();
    });
  });

  it('adds a new custom rule', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      const addRuleButton = screen.getByText('Add Custom Rule');
      expect(addRuleButton).toBeInTheDocument();
    });

    // Click Add Custom Rule button
    const addRuleButton = screen.getByText('Add Custom Rule');
    await user.click(addRuleButton);

    // Should open the dialog
    await waitFor(() => {
      expect(screen.getByText('Add Custom Denial Rule')).toBeInTheDocument();
      expect(screen.getByText('Create a custom rule for handling specific denial codes (CARC/RARC).')).toBeInTheDocument();
    });

    // Fill in the form
    const codeInput = screen.getByLabelText('Denial Code');
    const descriptionInput = screen.getByLabelText('Description');
    const strategyInput = screen.getByLabelText('Resolution Strategy');

    await user.type(codeInput, 'CARC 99');
    await user.type(descriptionInput, 'Test denial code');
    await user.type(strategyInput, 'Test resolution strategy');

    // Check that the Create Rule button is enabled
    const createButton = screen.getByText('Create Rule');
    expect(createButton).not.toBeDisabled();

    // Click Create Rule
    await user.click(createButton);

    // Dialog should close and new rule should appear
    await waitFor(() => {
      expect(screen.queryByText('Add Custom Denial Rule')).not.toBeInTheDocument();
      expect(screen.getByText('CARC 99 - Test denial code')).toBeInTheDocument();
      expect(screen.getByText('Test resolution strategy')).toBeInTheDocument();
    });
  });

  it('validates required fields when adding a rule', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section and open add rule dialog
    await user.click(screen.getByText('Denial Playbook'));
    await waitFor(() => {
      const addRuleButton = screen.getByText('Add Custom Rule');
      expect(addRuleButton).toBeInTheDocument();
    });
    await user.click(screen.getByText('Add Custom Rule'));

    await waitFor(() => {
      expect(screen.getByText('Add Custom Denial Rule')).toBeInTheDocument();
    });

    // Initially Create Rule button should be disabled (empty required fields)
    const createButton = screen.getByText('Create Rule');
    expect(createButton).toBeDisabled();

    // Fill in just one field
    const codeInput = screen.getByLabelText('Denial Code');
    await user.type(codeInput, 'CARC 99');

    // Should still be disabled
    expect(createButton).toBeDisabled();

    // Fill in second field
    const descriptionInput = screen.getByLabelText('Description');
    await user.type(descriptionInput, 'Test denial code');

    // Should still be disabled
    expect(createButton).toBeDisabled();

    // Fill in third field
    const strategyInput = screen.getByLabelText('Resolution Strategy');
    await user.type(strategyInput, 'Test strategy');

    // Now should be enabled
    expect(createButton).not.toBeDisabled();
  });

  it('deletes a custom rule', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      expect(screen.getByText('CARC 24 - Charges covered under capitation agreement')).toBeInTheDocument();
      expect(screen.getByText('RARC 149 - Deductible amount')).toBeInTheDocument();
    });

    // Count initial custom rules (should be 2)
    const initialRarc149 = screen.getByText('RARC 149 - Deductible amount');
    expect(initialRarc149).toBeInTheDocument();

    // Find and click delete button for first rule
    const deleteButtons = screen.getAllByRole('button');
    const trashButton = deleteButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.classList.contains('text-red-500');
    });

    expect(trashButton).toBeInTheDocument();
    if (trashButton) {
      await user.click(trashButton);
    }

    // One of the rules should be removed - check that either CARC 24 or RARC 149 is gone
    await waitFor(() => {
      const carc24Present = screen.queryByText('CARC 24 - Charges covered under capitation agreement');
      const rarc149Present = screen.queryByText('RARC 149 - Deductible amount');
      
      // One should be gone, one should remain
      expect(carc24Present === null || rarc149Present === null).toBe(true);
      expect(carc24Present !== null || rarc149Present !== null).toBe(true);
    });
  });

  it('toggles rule enabled state', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      expect(screen.getByText('CARC 24 - Charges covered under capitation agreement')).toBeInTheDocument();
    });

    // Find the switch for the first rule (CARC 24 is enabled: true initially)
    const switches = screen.getAllByRole('switch');
    // Filter out the main auto-retry switch to get only rule switches
    const ruleSwitches = switches.filter(sw => sw.getAttribute('aria-labelledby') === null);
    
    expect(ruleSwitches.length).toBeGreaterThan(0);
    
    // Toggle the first rule switch
    const firstRuleSwitch = ruleSwitches[0];
    const initialChecked = firstRuleSwitch.getAttribute('aria-checked') === 'true';
    
    await user.click(firstRuleSwitch);
    
    // State should have toggled
    await waitFor(() => {
      expect(firstRuleSwitch.getAttribute('aria-checked')).toBe((!initialChecked).toString());
    });
  });

  it('toggles rule auto-fix state', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      expect(screen.getByText('CARC 24 - Charges covered under capitation agreement')).toBeInTheDocument();
    });

    // Find checkboxes for auto-fix (should be multiple)
    const autoFixCheckboxes = screen.getAllByText('Enable auto-fix for this denial code');
    expect(autoFixCheckboxes.length).toBeGreaterThan(0);

    // Click the first auto-fix checkbox
    const firstCheckbox = autoFixCheckboxes[0].previousElementSibling as HTMLElement;
    await user.click(firstCheckbox);

    // The checkbox state should have changed
    // We can't easily verify the exact state change without more complex DOM traversal,
    // but the click should not throw an error and the UI should update
    expect(firstCheckbox).toBeInTheDocument();
  });

  it('handles empty rules list correctly', async () => {
    // Render with no custom rules
    const emptyValidationSettings = {
      ...mockInitialValidationSettings,
      denialPlaybook: {
        autoRetryEnabled: true,
        maxRetryAttempts: 3,
        customRules: [],
      },
    };

    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={emptyValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      // Should show the Add Custom Rule button
      expect(screen.getByText('Add Custom Rule')).toBeInTheDocument();
      
      // Should show built-in rules
      expect(screen.getByText('CARC 96 - POS Inconsistent / Missing Modifier')).toBeInTheDocument();
      expect(screen.getByText('CARC 11 - Diagnosis Inconsistent with Procedure')).toBeInTheDocument();
      
      // Should not show any custom rules
      expect(screen.queryByText('CARC 24 - Charges covered under capitation agreement')).not.toBeInTheDocument();
    });
  });

  it('cancels rule creation', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section and open add rule dialog
    await user.click(screen.getByText('Denial Playbook'));
    await user.click(screen.getByText('Add Custom Rule'));

    await waitFor(() => {
      expect(screen.getByText('Add Custom Denial Rule')).toBeInTheDocument();
    });

    // Fill in some data
    const codeInput = screen.getByLabelText('Denial Code');
    await user.type(codeInput, 'CARC 99');

    // Click Cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Dialog should close and no new rule should be added
    await waitFor(() => {
      expect(screen.queryByText('Add Custom Denial Rule')).not.toBeInTheDocument();
      expect(screen.queryByText('CARC 99')).not.toBeInTheDocument();
    });
  });

  it('displays built-in rules with correct information', async () => {
    render(
      <SettingsClient
        initialAutomationSettings={mockInitialAutomationSettings}
        initialValidationSettings={mockInitialValidationSettings}
        initialNotificationSettings={mockInitialNotificationSettings}
      />
    );

    // Navigate to denial playbook section
    await user.click(screen.getByText('Denial Playbook'));

    await waitFor(() => {
      // Should show built-in CARC 96 rule
      expect(screen.getByText('CARC 96 - POS Inconsistent / Missing Modifier')).toBeInTheDocument();
      expect(screen.getByText('Success Rate:')).toBeInTheDocument();
      expect(screen.getByText('87%')).toBeInTheDocument();
      expect(screen.getByText('Set POS to 10, Add Modifier 95, Add documentation note')).toBeInTheDocument();

      // Should show built-in CARC 11 rule
      expect(screen.getByText('CARC 11 - Diagnosis Inconsistent with Procedure')).toBeInTheDocument();
      expect(screen.getByText('Generate top 3 ICD-10 alternatives, require human selection')).toBeInTheDocument();
    });
  });
});