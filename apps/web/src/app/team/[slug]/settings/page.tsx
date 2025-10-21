import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { organizations, teamMembers } from '@foresight-cdss-next/db';
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

async function loadOrganizationData(slug: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Get organization by slug
    const { data: organization, error: orgError } = await safeSingle(async () =>
      db.select({
        id: organizations.id,
        name: organizations.name,
        npi: organizations.npi,
        taxId: organizations.taxId,
        email: organizations.email,
        phone: organizations.phone,
        addressLine1: organizations.addressLine1,
        addressLine2: organizations.addressLine2,
        city: organizations.city,
        state: organizations.state,
        zipCode: organizations.zipCode,
        settings: organizations.settings
      })
      .from(organizations)
      .where(and(
        eq(organizations.slug, slug),
        isNull(organizations.deletedAt)
      ))
    );

    if (orgError || !organization) {
      return null;
    }

    // Verify user has access to this organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        isActive: teamMembers.isActive
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.organizationId, organization.id),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return null;
    }

    return {
      id: organization.id,
      name: organization.name || '',
      taxId: organization.taxId || '',
      npiNumber: organization.npi || '',
      billingAddress: {
        addressLine1: organization.addressLine1 || '',
        addressLine2: organization.addressLine2 || '',
        city: organization.city || '',
        state: organization.state || '',
        zipCode: organization.zipCode || '',
      },
      primaryContact: {
        firstName: '', // We'll need to get this from Clerk or settings
        lastName: '',  // We'll need to get this from Clerk or settings
        email: organization.email || '',
        phone: organization.phone || '',
      },
    };
  } catch (error) {
    console.error('Error loading organization data:', error);
    return null;
  }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const searchParams = await params;

  const settingsData = await loadTeamSettings();
  const organizationData = await loadOrganizationData(searchParams.slug);

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
      teamSlug={searchParams.slug}
      initialOrganizationData={organizationData}
    />
  );
}
