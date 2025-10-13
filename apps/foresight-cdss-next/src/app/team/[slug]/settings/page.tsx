// import { createSupabaseServerClient } from "@/lib/supabase/server";
// import { requireTeamMembership } from "@/lib/team";
import SettingsClient from "@/components/settings/settings-client";

async function loadTeamSettings() {
  try {
    // const membership = await requireTeamMembership();
    // const supabase = await createSupabaseServerClient();

    // Get all settings for the team
    // const { data: settings, error } = await supabase
    //   .from("team_settings")
    //   .select("key, value")
    //   .eq("team_id", membership.team_id);
    //
    // if (error) {
    //   console.error("Error fetching team settings:", error);
    //   return { automation: {}, notifications: {}, validation: {} };
    // }

    // Convert array of settings to object
    // const settingsMap =
    //   settings?.reduce((acc, setting) => {
    //     acc[setting.key] = setting.value;
    //     return acc;
    //   }, {} as Record<string, any>) || {};
    const settingsMap = {} as Record<string, any>;

    return settingsMap;
  } catch (error) {
    // Re-throw redirect errors so they can be handled by Next.js
    if (error && typeof error === 'object' && 'digest' in error &&
        typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("Settings fetch error:", error);
    return { automation: {}, notifications: {}, validation: {} };
  }
}

export default async function SettingsPage() {
  const settingsData = await loadTeamSettings();

  // Default automation settings
  const defaultAutomationSettings = {
    autoApprovalThreshold: 90,
    requireReviewThreshold: 70,
    maxRetryAttempts: 3,
    confidenceScoreEnabled: true,
    ocrAccuracyThreshold: 95,
    globalConfidenceThreshold: 88,
    enableAutoSubmission: false,
    enableAutoEPA: false,
    fieldConfidenceThresholds: {
      cptCode: 85,
      icd10: 85,
      modifiers: 80,
    },
  };

  // Default notification settings
  const defaultNotificationSettings = {
    emailAlerts: true,
    slackIntegration: false,
    approvalNotifications: true,
    denialNotifications: true,
    systemMaintenanceAlerts: true,
    weeklyReports: true,
    dailyDigest: false,
  };

  // Default validation settings
  const defaultValidationSettings = {
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
      cptRules: [
        {
          id: "99213",
          cptCode: "99213",
          description: "Office Visit, Level 3",
          minMinutes: 20,
          maxMinutes: 29,
          enabled: true,
          flagIfNotDocumented: true,
        },
        {
          id: "99214",
          cptCode: "99214",
          description: "Office Visit, Level 4",
          minMinutes: 30,
          maxMinutes: 39,
          enabled: true,
          flagIfNotDocumented: true,
        },
        {
          id: "99215",
          cptCode: "99215",
          description: "Office Visit, Level 5",
          minMinutes: 40,
          maxMinutes: 54,
          enabled: true,
          flagIfNotDocumented: true,
        },
      ],
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
      customRules: [],
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

  // Merge with loaded settings
  const automationSettings = {
    ...defaultAutomationSettings,
    ...(settingsData.automation || {}),
  };

  const notificationSettings = {
    ...defaultNotificationSettings,
    ...(settingsData.notifications || {}),
  };

  const validationSettings = {
    ...defaultValidationSettings,
    ...(settingsData.validation || {}),
  };

  return (
    <SettingsClient
      initialAutomationSettings={automationSettings}
      initialNotificationSettings={notificationSettings}
      initialValidationSettings={validationSettings}
    />
  );
}
