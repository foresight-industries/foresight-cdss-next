'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Save,
  Bell,
  Shield,
  Database,
  Users,
  AlertTriangle,
  CheckCircle,
  Mail,
  Edit,
  Globe,
  Webhook,
  CreditCard,
  Settings,
  Gauge,
  Video,
  Code2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Building2,
  Stethoscope,
  Plus,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AutomationTab,
  NotificationsTab,
  VisitTypesTab,
  ModifiersTab,
  RequiredFieldsTab,
  TimeBasedTab,
  CredentialingTab,
  DenialPlaybookTab,
  DiagnosisValidationTab,
  EHRTab,
  WebhooksTab,
  PayersTab,
  FieldMappingsTab,
  SecurityTab,
  UserManagementTab,
  GeneralTab,
  PriorAuthDocumentsTab,
} from './tabs';

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

interface DosespotCredential {
  id: string;
  serviceName: string;
  serviceType: string;
  environment: string;
  credentialName: string;
  description?: string;
  isActive: boolean;
  isValid: boolean;
  lastValidated?: string;
  lastValidationError?: string;
  enabledFeatures: string[];
  connectionSettings: any;
  autoRenew: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface SettingsProps {
  teamSlug?: string;
  initialAutomationSettings: {
    autoApprovalThreshold: number;
    requireReviewThreshold: number;
    maxRetryAttempts: number;
    enableBulkProcessing: boolean;
    confidenceScoreEnabled: boolean;
    ocrAccuracyThreshold: number;
    globalConfidenceThreshold: number;
    enableAutoSubmission: boolean;
    enableAutoEPA: boolean;
    fieldConfidenceThresholds: {
      cptCode: number;
      icd10: number;
      placeOfService: number;
      modifiers: number;
    };
  };
  initialNotificationSettings: {
    emailAlerts: boolean;
    slackIntegration: boolean;
    approvalNotifications: boolean;
    denialNotifications: boolean;
    systemMaintenanceAlerts: boolean;
    weeklyReports: boolean;
    dailyDigest: boolean;
  };
  initialValidationSettings?: {
    visitTypes: {
      telehealth: boolean;
      inPerson: boolean;
      home: boolean;
    };
    posRules: {
      enforceTelehealthPOS: boolean;
      enforceInPersonPOS: boolean;
      enforceHomePOS: boolean;
    };
    modifierRules: {
      modifier95Required: boolean;
      autoAddModifier95: boolean;
      modifier95ConflictResolution: boolean;
      validateModifierCombinations: boolean;
      requireModifierDocumentation: boolean;
      blockInvalidModifiers: boolean;
      enablePayerSpecificRules: boolean;
      conflictRules: Array<{
        id: string;
        name: string;
        conflictingModifiers: string[];
        resolution:
          | "remove_conflicting"
          | "prefer_first"
          | "prefer_last"
          | "block_submission"
          | "manual_review";
        description?: string;
        enabled: boolean;
      }>;
    };
    requiredFields: {
      blockOnMissingFields: boolean;
    };
    timeBasedValidation: {
      enabled: boolean;
      extractTimeFromNotes: boolean;
      cptRules: Array<{
        id: string;
        cptCode: string;
        description: string;
        minMinutes: number;
        maxMinutes: number;
        enabled: boolean;
        flagIfNotDocumented: boolean;
      }>;
    };
    credentialingRules: {
      enforceCredentialing: boolean;
      allowedStatuses: string[];
      multiStateLicensure: boolean;
      showCredentialingAlerts: boolean;
    };
    denialPlaybook: {
      autoRetryEnabled: boolean;
      maxRetryAttempts: number;
      customRules: Array<{
        id: string;
        code: string;
        description: string;
        strategy: string;
        enabled: boolean;
        autoFix: boolean;
      }>;
    };
    diagnosisValidation: {
      validateIcdToCpt: boolean;
      medicalNecessityThreshold: number;
      suggestAlternativeDx: boolean;
    };
    auditLogging: {
      logRuleApplications: boolean;
      logAutoFixes: boolean;
      retentionPeriod: string;
    };
  };
  initialOrganizationData?: {
    id: string;
    name: string;
    taxId: string;
    npiNumber: string;
    billingAddress: {
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      zipCode: string;
    };
    primaryContact: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  } | null;
}

const settingsSections: SettingsSection[] = [
  {
    id: "general",
    title: "General",
    icon: Building2,
    description: "Basic organization information and administrative settings",
  },
  {
    id: "automation",
    title: "Automation & Confidence",
    icon: Gauge,
    description: "Control when claims and ePAs require human review",
  },
  {
    id: "visit-types",
    title: "Visit Types & POS",
    icon: Video,
    description: "Define supported visit types and required POS codes",
  },
  {
    id: "modifiers",
    title: "Modifiers",
    icon: Code2,
    description: "Configure required modifiers and conflict resolution",
  },
  {
    id: "required-fields",
    title: "Required Fields",
    icon: CheckCircle,
    description: "Define minimum data requirements before submission",
  },
  {
    id: "time-based",
    title: "Time-Based Coding",
    icon: Clock,
    description: "Configure time requirements for E/M codes",
  },
  {
    id: "credentialing",
    title: "Credentialing",
    icon: ShieldCheck,
    description: "Enforce provider credentialing and licensing requirements",
  },
  {
    id: "denial-playbook",
    title: "Denial Playbook",
    icon: RefreshCw,
    description: "Configure automatic denial resolution strategies",
  },
  {
    id: "diagnosis-validation",
    title: "Diagnosis Validation",
    icon: Stethoscope,
    description: "Validate medical necessity and ICD-10 to CPT compatibility",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    description: "Manage alerts and notification preferences",
  },
  {
    id: "ehr",
    title: "EHR Integration",
    icon: Globe,
    description: "Electronic Health Record system connections",
  },
  {
    id: "webhooks",
    title: "Webhooks",
    icon: Webhook,
    description: "Real-time data synchronization webhooks",
  },
  {
    id: "payers",
    title: "Payer Configuration",
    icon: CreditCard,
    description: "Manage insurance payer configurations",
  },
  {
    id: "prior-auth-documents",
    title: "Prior Auth Documents",
    icon: FileText,
    description: "Configure default documents for PA submissions",
  },
  {
    id: "field-mappings",
    title: "Field Mappings",
    icon: Settings,
    description: "Configure custom field mapping rules",
  },
  {
    id: "integrations",
    title: "Other Integrations",
    icon: Database,
    description: "API connections and data sync settings",
  },
  {
    id: "security",
    title: "Security & Access",
    icon: Shield,
    description: "User permissions and security settings",
  },
  {
    id: "users",
    title: "User Management",
    icon: Users,
    description: "Manage team members and roles",
  },
];

function SettingsPageContent({
  teamSlug,
  initialAutomationSettings,
  initialNotificationSettings,
  initialValidationSettings,
  initialOrganizationData,
}: Readonly<SettingsProps>) {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "provider",
    sendWelcomeEmail: true,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveUserModal, setShowRemoveUserModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const [editingUser, setEditingUser] = useState<{
    index: number;
    name: string;
    email: string;
    role: string;
    status: string;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "PA Coordinator",
    status: "Active",
  });

  // Conflict Rule Modal State
  const [showConflictRuleModal, setShowConflictRuleModal] = useState(false);
  const [editingConflictRule, setEditingConflictRule] = useState<{
    id: string;
    name: string;
    conflictingModifiers: string[];
    resolution: string;
    description?: string;
    enabled: boolean;
  } | null>(null);
  const [conflictRuleForm, setConflictRuleForm] = useState({
    name: "",
    conflictingModifiers: [""],
    resolution: "remove_conflicting" as
      | "remove_conflicting"
      | "prefer_first"
      | "prefer_last"
      | "block_submission"
      | "manual_review",
    description: "",
    enabled: true,
  });

  const [showCptRuleModal, setShowCptRuleModal] = useState(false);
  const [cptRuleForm, setCptRuleForm] = useState({
    cptCode: "",
    description: "",
    minMinutes: 15,
    maxMinutes: 30,
    enabled: true,
    flagIfNotDocumented: true,
  });

  const [automationSettings, setAutomationSettings] = useState(
    initialAutomationSettings
  );
  const [notificationSettings, setNotificationSettings] = useState(
    initialNotificationSettings
  );

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
      retentionPeriod: "7years",
    },
  };

  const [validationSettings, setValidationSettings] = useState(
    initialValidationSettings || defaultValidationSettings
  );

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationLoading, setOrganizationLoading] = useState(true);

  // Load organization ID from team slug
  useEffect(() => {
    const loadOrganization = async () => {
      if (!teamSlug) {
        setOrganizationLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizations/by-slug/${teamSlug}`);
        const data = await response.json();

        if (response.ok && data.organization) {
          setOrganizationId(data.organization.id);
        } else {
          console.error('Failed to load organization:', data.error);
        }
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setOrganizationLoading(false);
      }
    };

    loadOrganization();
  }, [teamSlug]);

  const [teamMembers, setTeamMembers] = useState([
    {
      name: "Jane Doe",
      email: "jane@foresight.health",
      role: "Administrator",
      status: "Active",
    },
    {
      name: "John Smith",
      email: "john@foresight.health",
      role: "PA Coordinator",
      status: "Active",
    },
    {
      name: "Sarah Wilson",
      email: "sarah@foresight.health",
      role: "PA Reviewer",
      status: "Pending",
    },
  ]);

  const [integrationStatus] = useState({
    dosespot: { connected: true, lastSync: "2 minutes ago", status: "healthy" },
    aws: { connected: true, lastSync: "Real-time", status: "healthy" },
    openai: { connected: true, lastSync: "1 minute ago", status: "healthy" },
    webhooks: {
      connected: true,
      lastSync: "30 seconds ago",
      status: "healthy",
    },
  });

  const [showCustomRuleDialog, setShowCustomRuleDialog] = useState(false);
  const [customRuleForm, setCustomRuleForm] = useState({
    code: "",
    description: "",
    strategy: "",
    enabled: true,
    autoFix: false,
  });

  const [showPayerOverrideDialog, setShowPayerOverrideDialog] = useState(false);
  const [payerOverrideForm, setPayerOverrideForm] = useState({
    payerName: "",
    ruleName: "",
    description: "",
    ruleType: "validation" as
      | "validation"
      | "field_mapping"
      | "modifier"
      | "pos",
    conditions: [""],
    actions: [""],
    enabled: true,
  });

  // Payer Configuration State
  const [showPayerConfigDialog, setShowPayerConfigDialog] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState<string>("");
  const [authType, setAuthType] = useState<string>("api_key");
  const [showFieldMappingDialog, setShowFieldMappingDialog] = useState(false);
  const [showDeleteMappingDialog, setShowDeleteMappingDialog] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<number | null>(null);
  const [editingFieldMappingIndex, setEditingFieldMappingIndex] = useState<
    number | null
  >(null);
  const [editingPayerRule, setEditingPayerRule] = useState<string | null>(null);

  const [fieldMappingForm, setFieldMappingForm] = useState({
    payer: "",
    field: "",
    mapping: "",
    enabled: true,
  });

  // Payer Rules State
  const [payerRules, setPayerRules] = useState([
    {
      id: "medicare-part-b",
      payerName: "Medicare",
      ruleName: "Part B Claims",
      description: "Custom validation rules for Medicare Part B submissions",
      enabled: true,
      rules: [
        "Require NPI validation",
        "Block modifier GT",
        "Mandatory place of service 11",
      ],
    },
    {
      id: "aetna-pa",
      payerName: "Aetna",
      ruleName: "Prior Authorization",
      description: "Enhanced validation for Aetna PA requirements",
      enabled: true,
      rules: [
        "Require step therapy documentation",
        "Custom authorization numbers",
      ],
    },
    {
      id: "bcbs-telehealth",
      payerName: "Blue Cross Blue Shield",
      ruleName: "Telehealth",
      description: "State-specific telehealth requirements",
      enabled: false,
      rules: ["State-specific POS codes", "Enhanced modifier 95 validation"],
    },
  ]);

  // Field Mappings State
  const [fieldMappings, setFieldMappings] = useState([
    {
      payer: "UnitedHealthcare",
      field: "Provider ID",
      mapping: "Use Tax ID instead of NPI for certain claim types",
      enabled: true,
    },
    {
      payer: "Cigna",
      field: "Diagnosis Code",
      mapping: "Require primary diagnosis in position 1 only",
      enabled: true,
    },
    {
      payer: "Medicare",
      field: "Service Date",
      mapping: "Use encounter date when service date is missing",
      enabled: false,
    },
  ]);

  // Special Handling Rules State
  const [specialHandlingRules, setSpecialHandlingRules] = useState({
    autoRetryFailedClaims: true,
    priorityProcessingHighValue: false,
    batchProcessingMedicare: true,
  });

  // DoseSpot Credentials State
  const [dosespotCredentials, setDosespotCredentials] = useState<DosespotCredential[]>([]);
  const [showDosespotModal, setShowDosespotModal] = useState(false);
  const [validatingCredentialId, setValidatingCredentialId] = useState<string | null>(null);
  const [dosespotFormData, setDosespotFormData] = useState({
    credentialName: '',
    description: '',
    serviceName: 'dosespot',
    serviceType: 'erx',
    environment: 'sandbox',
    enabledFeatures: ['erx'],
    connectionSettings: {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    autoRenew: false,
    expiresAt: '',
    credentials: {
      apiKey: '',
      clinicKey: '',
      clinicId: '',
      userId: '',
      subscriptionKey: '',
    },
  });
  const [editingDosespotIndex, setEditingDosespotIndex] = useState<number | null>(null);

  // Handle URL parameters to navigate to specific sections
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && settingsSections.some((s) => s.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Add navigation warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const handleSave = async () => {
    try {
      const settingsToSave = {
        automation: automationSettings,
        notifications: notificationSettings,
        validation: validationSettings,
      };

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (response.ok) {
        setHasChanges(false);
        console.log("Settings saved successfully");
      } else {
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleSettingChange = (section: string, key: string, value: any) => {
    setHasChanges(true);
    if (section === "automation") {
      setAutomationSettings((prev) => ({ ...prev, [key]: value }));
    } else if (section === "notifications") {
      setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    } else if (section === "validation") {
      setValidationSettings((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleInviteUser = async () => {
    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteForm.email,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          role: inviteForm.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      // Reset form and close modal on success
      setInviteForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "provider",
        sendWelcomeEmail: true,
      });
      setShowInviteModal(false);

      // Show success message
      alert(`Invitation sent successfully to ${inviteForm.email}!`);
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteFormChange = (key: string, value: any) => {
    setInviteForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditUser = (index: number) => {
    const user = teamMembers[index];
    const [firstName, lastName] = user.name.split(" ");

    setEditingUser({ index, ...user });
    setEditForm({
      firstName: firstName || "",
      lastName: lastName || "",
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEditUser = () => {
    if (
      !editingUser ||
      !editForm.email ||
      !editForm.firstName ||
      !editForm.lastName
    )
      return;

    const updatedMembers = [...teamMembers];
    updatedMembers[editingUser.index] = {
      name: `${editForm.firstName} ${editForm.lastName}`,
      email: editForm.email,
      role: editForm.role,
      status: editForm.status,
    };

    setTeamMembers(updatedMembers);
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      firstName: "",
      lastName: "",
      email: "",
      role: "PA Coordinator",
      status: "Active",
    });

    alert(
      `User ${editForm.firstName} ${editForm.lastName} updated successfully`
    );
  };

  const handleEditFormChange = (key: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemoveUser = (index: number) => {
    const user = teamMembers[index];
    setUserToRemove({ index, name: user.name });
    setShowRemoveUserModal(true);
  };

  const confirmRemoveUser = () => {
    if (userToRemove !== null) {
      const updatedMembers = teamMembers.filter(
        (_, i) => i !== userToRemove.index
      );
      setTeamMembers(updatedMembers);
      alert(`User ${userToRemove.name} has been removed from the team.`);
    }
    setShowRemoveUserModal(false);
    setUserToRemove(null);
  };

  // Conflict Rule Handlers
  const handleSaveConflictRule = () => {
    if (
      !conflictRuleForm.name ||
      conflictRuleForm.conflictingModifiers.filter((m) => m.trim()).length < 2
    ) {
      return;
    }

    const newRule = {
      id: editingConflictRule?.id || `rule_${Date.now()}`,
      name: conflictRuleForm.name,
      conflictingModifiers: conflictRuleForm.conflictingModifiers.filter((m) =>
        m.trim()
      ),
      resolution: conflictRuleForm.resolution,
      description: conflictRuleForm.description,
      enabled: conflictRuleForm.enabled,
    };

    const existingRules = validationSettings.modifierRules?.conflictRules || [];
    let updatedRules;

    if (editingConflictRule) {
      // Edit existing rule
      const index = existingRules.findIndex(
        (r) => r.id === editingConflictRule.id
      );
      updatedRules = [...existingRules];
      updatedRules[index] = newRule;
    } else {
      // Add new rule
      updatedRules = [...existingRules, newRule];
    }

    handleSettingChange("validation", "modifierRules", {
      ...validationSettings.modifierRules,
      conflictRules: updatedRules,
    });

    setShowConflictRuleModal(false);
    setEditingConflictRule(null);
    setConflictRuleForm({
      name: "",
      conflictingModifiers: [""],
      resolution: "remove_conflicting",
      description: "",
      enabled: true,
    });
  };

  const handleConflictRuleFormChange = (key: string, value: any) => {
    setConflictRuleForm((prev) => ({ ...prev, [key]: value }));
  };

  const addConflictingModifier = () => {
    setConflictRuleForm((prev) => ({
      ...prev,
      conflictingModifiers: [...prev.conflictingModifiers, ""],
    }));
  };

  const removeConflictingModifier = (index: number) => {
    setConflictRuleForm((prev) => ({
      ...prev,
      conflictingModifiers: prev.conflictingModifiers.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateConflictingModifier = (index: number, value: string) => {
    setConflictRuleForm((prev) => ({
      ...prev,
      conflictingModifiers: prev.conflictingModifiers.map((mod, i) =>
        i === index ? value : mod
      ),
    }));
  };

  // CPT Rule Handlers
  const handleSaveCptRule = () => {
    if (!cptRuleForm.cptCode || !cptRuleForm.description) {
      return;
    }

    const newRule = {
      id: `cpt_${Date.now()}`,
      cptCode: cptRuleForm.cptCode,
      description: cptRuleForm.description,
      minMinutes: cptRuleForm.minMinutes,
      maxMinutes: cptRuleForm.maxMinutes,
      enabled: cptRuleForm.enabled,
      flagIfNotDocumented: cptRuleForm.flagIfNotDocumented,
    };

    const existingRules =
      validationSettings.timeBasedValidation?.cptRules || [];
    const updatedRules = [...existingRules, newRule];

    handleSettingChange("validation", "timeBasedValidation", {
      ...validationSettings.timeBasedValidation,
      cptRules: updatedRules,
    });

    setShowCptRuleModal(false);
    setCptRuleForm({
      cptCode: "",
      description: "",
      minMinutes: 15,
      maxMinutes: 30,
      enabled: true,
      flagIfNotDocumented: true,
    });
  };

  const handleCptRuleFormChange = (key: string, value: any) => {
    setCptRuleForm((prev) => ({ ...prev, [key]: value }));
  };

  // Custom Denial Rule Handlers
  const handleSaveCustomRule = () => {
    if (
      !customRuleForm.code ||
      !customRuleForm.description ||
      !customRuleForm.strategy
    ) {
      return;
    }

    const newRule = {
      id: `custom_${Date.now()}`,
      code: customRuleForm.code,
      description: customRuleForm.description,
      strategy: customRuleForm.strategy,
      enabled: customRuleForm.enabled,
      autoFix: customRuleForm.autoFix,
    };

    const existingRules = validationSettings.denialPlaybook?.customRules || [];
    const updatedRules = [...existingRules, newRule];

    handleSettingChange("validation", "denialPlaybook", {
      ...validationSettings.denialPlaybook,
      customRules: updatedRules,
    });

    setShowCustomRuleDialog(false);
    setCustomRuleForm({
      code: "",
      description: "",
      strategy: "",
      enabled: true,
      autoFix: false,
    });
  };

  const handleCustomRuleFormChange = (key: string, value: any) => {
    setCustomRuleForm((prev) => ({ ...prev, [key]: value }));
  };

  // Payer Override Rule Handlers
  const handleSavePayerOverride = async () => {
    if (
      !payerOverrideForm.payerName ||
      !payerOverrideForm.ruleName ||
      !payerOverrideForm.description
    ) {
      return;
    }

    try {
      const response = await fetch("/api/payer-override-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payer_name: payerOverrideForm.payerName,
          rule_name: payerOverrideForm.ruleName,
          description: payerOverrideForm.description,
          rule_type: payerOverrideForm.ruleType,
          conditions: payerOverrideForm.conditions.filter((c) => c.trim()),
          actions: payerOverrideForm.actions.filter((a) => a.trim()),
          enabled: payerOverrideForm.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payer override rule");
      }

      const result = await response.json();
      console.log("Payer override rule created:", result);

      setShowPayerOverrideDialog(false);
      setPayerOverrideForm({
        payerName: "",
        ruleName: "",
        description: "",
        ruleType: "validation",
        conditions: [""],
        actions: [""],
        enabled: true,
      });
    } catch (error) {
      console.error("Error creating payer override rule:", error);
    }
  };

  const addPayerCondition = (): void => {
    setPayerOverrideForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, ""],
    }));
  };

  const removePayerCondition = (index: number): void => {
    setPayerOverrideForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updatePayerCondition = (index: number, value: string): void => {
    setPayerOverrideForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? value : condition
      ),
    }));
  };

  const addPayerAction = (): void => {
    setPayerOverrideForm((prev) => ({
      ...prev,
      actions: [...prev.actions, ""],
    }));
  };

  const removePayerAction = (index: number): void => {
    setPayerOverrideForm((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updatePayerAction = (index: number, value: string): void => {
    setPayerOverrideForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) => (i === index ? value : action)),
    }));
  };

  // Payer Configuration Handlers
  const handleConfigurePayer = (payerName: string) => {
    setSelectedPayer(payerName);
    setShowPayerConfigDialog(true);
  };

  const handleTogglePayerRule = (ruleId: string, enabled: boolean) => {
    setPayerRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
    );
  };

  const handleEditPayerRule = (ruleId: string) => {
    const rule = payerRules.find((r) => r.id === ruleId);
    if (rule) {
      setEditingPayerRule(ruleId);
      setPayerOverrideForm({
        payerName: rule.payerName.toLowerCase(),
        ruleName: rule.ruleName,
        description: rule.description,
        ruleType: "validation",
        conditions: rule.rules,
        actions: ["Apply validation rules"],
        enabled: rule.enabled,
      });
      setShowPayerOverrideDialog(true);
    }
  };

  // Field Mapping Handlers
  const handleSaveFieldMapping = () => {
    if (
      !fieldMappingForm.payer ||
      !fieldMappingForm.field ||
      !fieldMappingForm.mapping
    ) {
      return;
    }

    const payerDisplayName =
      fieldMappingForm.payer === "unitedhealth"
        ? "UnitedHealthcare"
        : fieldMappingForm.payer === "bcbs"
        ? "Blue Cross Blue Shield"
        : fieldMappingForm.payer.charAt(0).toUpperCase() +
          fieldMappingForm.payer.slice(1);

    const fieldDisplayName = fieldMappingForm.field
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const newMapping = {
      payer: payerDisplayName,
      field: fieldDisplayName,
      mapping: fieldMappingForm.mapping,
      enabled: fieldMappingForm.enabled,
    };

    if (editingFieldMappingIndex) {
      // Update existing mapping
      setFieldMappings((prev) =>
        prev.map((mapping, i) =>
          i === editingFieldMappingIndex ? newMapping : mapping
        )
      );
    } else {
      // Add new mapping
      setFieldMappings((prev) => [...prev, newMapping]);
    }

    setShowFieldMappingDialog(false);
    setEditingFieldMappingIndex(null);
    setFieldMappingForm({
      payer: "",
      field: "",
      mapping: "",
      enabled: true,
    });
  };

  const handleToggleFieldMapping = (index: number, enabled: boolean) => {
    setFieldMappings((prev) =>
      prev.map((mapping, i) =>
        i === index ? { ...mapping, enabled } : mapping
      )
    );
  };

  const handleEditFieldMapping = (index: number) => {
    const mapping = fieldMappings[index];
    setEditingFieldMappingIndex(index);

    // Convert display names back to form values
    const payerValue =
      mapping.payer === "UnitedHealthcare"
        ? "unitedhealth"
        : mapping.payer === "Blue Cross Blue Shield"
        ? "bcbs"
        : mapping.payer.toLowerCase();

    const fieldValue =
      mapping.field === "Provider ID"
        ? "provider-id"
        : mapping.field === "Diagnosis Code"
        ? "diagnosis-code"
        : mapping.field === "Service Date"
        ? "service-date"
        : mapping.field === "Place of Service"
        ? "place-of-service"
        : mapping.field === "Authorization Number"
        ? "authorization-number"
        : mapping.field.toLowerCase().replace(/\s+/g, "-");

    setFieldMappingForm({
      payer: payerValue,
      field: fieldValue,
      mapping: mapping.mapping,
      enabled: mapping.enabled,
    });
    setShowFieldMappingDialog(true);
  };

  const handleDeleteFieldMapping = (index: number) => {
    setMappingToDelete(index);
    setShowDeleteMappingDialog(true);
  };

  const confirmDeleteMapping = () => {
    if (mappingToDelete !== null) {
      setFieldMappings((prev) => prev.filter((_, i) => i !== mappingToDelete));
      setMappingToDelete(null);
    }
    setShowDeleteMappingDialog(false);
  };

  // Special Handling Rules Handlers
  const handleToggleSpecialRule = (
    rule: keyof typeof specialHandlingRules,
    enabled: boolean
  ) => {
    setSpecialHandlingRules((prev) => ({ ...prev, [rule]: enabled }));
  };

  // DoseSpot Credential Handlers
  const handleValidateDosespotCredential = async (credentialId: string) => {
    setValidatingCredentialId(credentialId);
    try {
      const response = await fetch(`/api/external-credentials/${credentialId}/validate`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.isValid) {
        // Update local state
        setDosespotCredentials(prev =>
          prev.map(cred =>
            cred.id === credentialId
              ? { ...cred, isValid: true, lastValidated: result.lastValidated }
              : cred
          )
        );
      } else {
        setDosespotCredentials(prev =>
          prev.map(cred =>
            cred.id === credentialId
              ? { ...cred, isValid: false, lastValidationError: result.error }
              : cred
          )
        );
      }
    } catch (error) {
      console.error('Error validating credential:', error);
    } finally {
      setValidatingCredentialId(null);
    }
  };

  const handleEditDosespotCredential = (index: number) => {
    const credential = dosespotCredentials[index];
    setEditingDosespotIndex(index);
    setDosespotFormData({
      credentialName: credential.credentialName,
      description: credential.description ?? '',
      serviceName: credential.serviceName,
      serviceType: credential.serviceType,
      environment: credential.environment,
      enabledFeatures: credential.enabledFeatures,
      connectionSettings: credential.connectionSettings ?? {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
      autoRenew: credential.autoRenew,
      expiresAt: credential.expiresAt ?? '',
      credentials: {
        apiKey: '',
        clinicKey: '',
        clinicId: '',
        userId: '',
        subscriptionKey: '',
      },
    });
    setShowDosespotModal(true);
  };

  const handleDeleteDosespotCredential = async (index: number) => {
    const credential = dosespotCredentials[index];
    if (confirm(`Are you sure you want to delete "${credential.credentialName}"?`)) {
      try {
        const response = await fetch(`/api/external-credentials/${credential.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setDosespotCredentials(prev => prev.filter((_, i) => i !== index));
        } else {
          console.error('Failed to delete credential');
        }
      } catch (error) {
        console.error('Error deleting credential:', error);
      }
    }
  };

  const handleSaveDosespotCredential = async () => {
    try {
      const endpoint = editingDosespotIndex !== null
        ? `/api/external-credentials/${dosespotCredentials[editingDosespotIndex].id}`
        : '/api/external-credentials';

      const method = editingDosespotIndex !== null ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dosespotFormData),
      });

      const result = await response.json();

      if (result.success) {
        if (editingDosespotIndex !== null) {
          // Update existing credential
          setDosespotCredentials(prev =>
            prev.map((cred, i) =>
              i === editingDosespotIndex ? result.data.credential : cred
            )
          );
        } else {
          // Add new credential
          setDosespotCredentials(prev => [...prev, result.data.credential]);
        }

        setShowDosespotModal(false);
        setEditingDosespotIndex(null);
        setDosespotFormData({
          credentialName: '',
          description: '',
          serviceName: 'dosespot',
          serviceType: 'erx',
          environment: 'sandbox',
          enabledFeatures: ['erx'],
          connectionSettings: {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
          },
          autoRenew: false,
          expiresAt: '',
          credentials: {
            apiKey: '',
            clinicKey: '',
            clinicId: '',
            userId: '',
            subscriptionKey: '',
          },
        });
      } else {
        console.error('Failed to save credential:', result.error);
      }
    } catch (error) {
      console.error('Error saving credential:', error);
    }
  };

  // Load DoseSpot credentials only when on integrations tab
  useEffect(() => {
    if (activeSection === 'integrations') {
      const loadDosespotCredentials = async () => {
        try {
          const response = await fetch('/api/external-credentials');
          const result = await response.json();

          if (result.success) {
            setDosespotCredentials(result.data.credentials || []);
          }
        } catch (error) {
          console.error('Error loading DoseSpot credentials:', error);
        }
      };

      loadDosespotCredentials();
    }
  }, [activeSection]);

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          API Connections
        </h3>
        <div className="space-y-4">
          {Object.entries(integrationStatus)
            .filter(([key]) => key !== "webhooks")
            .map(([key, integration]) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      integration.status === "healthy"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {key === "aws" ? "Amazon Web Services" : key === 'openai' ? 'OpenAI' : key}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last sync: {integration.lastSync}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      integration.status === "healthy" ? "default" : "secondary"
                    }
                    className={
                      integration.status === "healthy"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {integration.status === "healthy" ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Error
                      </>
                    )}
                  </Badge>
                  <Button variant="secondary" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* DoseSpot Credentials Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              DoseSpot Credentials
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage API credentials for eRx and ePA processing
            </p>
          </div>
          <Button onClick={() => setShowDosespotModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Credentials
          </Button>
        </div>

        {dosespotCredentials.length === 0 ? (
          <div className="text-center py-8">
            <Stethoscope className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No DoseSpot credentials configured
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your DoseSpot API credentials to enable eRx and ePA processing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {dosespotCredentials.map((credential, index) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      credential.isValid ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {credential.credentialName}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{credential.environment}</span>
                      <span>•</span>
                      <span>{credential.enabledFeatures.join(', ')}</span>
                    </div>
                    {credential.lastValidationError && (
                      <p className="text-xs text-red-600 mt-1">{credential.lastValidationError}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={credential.isValid ? "default" : "destructive"}
                    className={
                      credential.isValid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {credential.isValid ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Invalid
                      </>
                    )}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleValidateDosespotCredential(credential.id)}
                    disabled={validatingCredentialId === credential.id}
                  >
                    {validatingCredentialId === credential.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDosespotCredential(index)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDosespotCredential(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        if (!initialOrganizationData) {
          return <div className="flex items-center justify-center py-8">Organization not found</div>;
        }
        return <GeneralTab initialOrganizationData={initialOrganizationData} />;
      case "automation":
        return (
          <AutomationTab
            automationSettings={automationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("automation", key, value)
            }
          />
        );
      case "visit-types":
        return (
          <VisitTypesTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "notifications":
        return (
          <NotificationsTab
            notificationSettings={notificationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("notifications", key, value)
            }
          />
        );
      case "modifiers":
        return (
          <ModifiersTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "required-fields":
        return (
          <RequiredFieldsTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "time-based":
        return (
          <TimeBasedTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "credentialing":
        return (
          <CredentialingTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "denial-playbook":
        return (
          <DenialPlaybookTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "diagnosis-validation":
        return (
          <DiagnosisValidationTab
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "payers":
        return (
          <PayersTab
            payerRules={payerRules}
            fieldMappings={fieldMappings}
            specialHandlingRules={specialHandlingRules}
            onConfigurePayer={handleConfigurePayer}
            onTogglePayerRule={handleTogglePayerRule}
            onEditPayerRule={handleEditPayerRule}
            onAddPayerRule={() => {
              setEditingPayerRule(null);
              setPayerOverrideForm({
                payerName: "",
                ruleName: "",
                description: "",
                ruleType: "validation",
                conditions: [""],
                actions: [""],
                enabled: true,
              });
              setShowPayerOverrideDialog(true);
            }}
            onToggleFieldMapping={handleToggleFieldMapping}
            onEditFieldMapping={handleEditFieldMapping}
            onDeleteFieldMapping={handleDeleteFieldMapping}
            onAddFieldMapping={() => {
              setEditingFieldMappingIndex(null);
              setFieldMappingForm({
                payer: "",
                field: "",
                mapping: "",
                enabled: true,
              });
              setShowFieldMappingDialog(true);
            }}
            onToggleSpecialRule={handleToggleSpecialRule}
          />
        );
      case "prior-auth-documents":
        if (organizationLoading) {
          return <div className="flex items-center justify-center py-8">Loading organization...</div>;
        }
        if (!organizationId) {
          return <div className="flex items-center justify-center py-8">Organization not found</div>;
        }
        return teamSlug ? (
          <PriorAuthDocumentsTab
            organizationId={organizationId}
            teamSlug={teamSlug}
          />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Team slug is required to manage Prior Authorization documents.
          </div>
        );
      case "ehr":
        return <EHRTab />;
      case "webhooks":
        return <WebhooksTab teamSlug={teamSlug} />;
      case "field-mappings":
        return <FieldMappingsTab />;
      case "integrations":
        return renderIntegrationSettings();
      case "security":
        if (organizationLoading) {
          return <div className="flex items-center justify-center py-8">Loading organization...</div>;
        }
        if (!organizationId) {
          return <div className="flex items-center justify-center py-8">Organization not found</div>;
        }
        return (
          <SecurityTab
            organizationId={organizationId}
            validationSettings={validationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("validation", key, value)
            }
          />
        );
      case "users":
        return (
          <UserManagementTab
            teamMembers={teamMembers}
            onInviteUser={() => setShowInviteModal(true)}
            onEditUser={handleEditUser}
            onRemoveUser={handleRemoveUser}
          />
        );
      default:
        return (
          <AutomationTab
            automationSettings={automationSettings}
            onSettingChange={(key, value) =>
              handleSettingChange("automation", key, value)
            }
          />
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} className="flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <Card className="p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      // Smooth scroll to top of content
                      document
                        .getElementById("settings-content")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-4 flex-shrink-0 transition-colors ${
                        activeSection === section.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div id="settings-content" className="flex-1">
          <Card className="p-6">{renderSectionContent()}</Card>
        </div>
      </div>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Invite New User
            </DialogTitle>
            <DialogDescription>
              Send an invitation to add a new team member to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="invite-firstName">First Name</Label>
                <Input
                  id="invite-firstName"
                  type="text"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    handleInviteFormChange("firstName", e.target.value)
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-lastName">Last Name</Label>
                <Input
                  id="invite-lastName"
                  type="text"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    handleInviteFormChange("lastName", e.target.value)
                  }
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                inputMode="email"
                value={inviteForm.email}
                onChange={(e) =>
                  handleInviteFormChange("email", e.target.value)
                }
                placeholder="john.smith@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <div className="w-full">
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) =>
                    handleInviteFormChange("role", value)
                  }
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PA Coordinator">
                      PA Coordinator
                    </SelectItem>
                    <SelectItem value="PA Reviewer">PA Reviewer</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Read Only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="invite-welcomeEmail"
                checked={inviteForm.sendWelcomeEmail}
                onCheckedChange={(checked) =>
                  handleInviteFormChange("sendWelcomeEmail", checked)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="invite-welcomeEmail"
                className="text-sm leading-tight"
              >
                Send welcome email with setup instructions
              </Label>
            </div>
          </div>

          {inviteError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Invitation Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{inviteError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteModal(false)}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={
                inviteLoading ||
                !inviteForm.email ||
                !inviteForm.firstName ||
                !inviteForm.lastName
              }
            >
              {inviteLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-primary" />
              Edit Team Member
            </DialogTitle>
            <DialogDescription>
              Update the team member&apos;s information and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) =>
                    handleEditFormChange("firstName", e.target.value)
                  }
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) =>
                    handleEditFormChange("lastName", e.target.value)
                  }
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                inputMode="email"
                value={editForm.email}
                onChange={(e) => handleEditFormChange("email", e.target.value)}
                placeholder="jane.doe@company.com"
                required
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. To use a different email, create a new
                user.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <div className="w-full">
                <Select
                  value={editForm.role}
                  onValueChange={(value) => handleEditFormChange("role", value)}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PA Coordinator">
                      PA Coordinator
                    </SelectItem>
                    <SelectItem value="PA Reviewer">PA Reviewer</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Read Only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <div className="w-full">
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    handleEditFormChange("status", value)
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditUser}
              disabled={
                !editForm.email || !editForm.firstName || !editForm.lastName
              }
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Rule Modal */}
      <Dialog
        open={showConflictRuleModal}
        onOpenChange={setShowConflictRuleModal}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Code2 className="w-5 h-5 mr-2 text-primary" />
              {editingConflictRule ? "Edit Conflict Rule" : "Add Conflict Rule"}
            </DialogTitle>
            <DialogDescription>
              Define how to handle conflicting modifier combinations
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                type="text"
                value={conflictRuleForm.name}
                onChange={(e) =>
                  handleConflictRuleFormChange("name", e.target.value)
                }
                placeholder="e.g., 95 vs GT Conflict"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Conflicting Modifiers</Label>
              <div className="space-y-2">
                {conflictRuleForm.conflictingModifiers.map(
                  (modifier, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={modifier}
                        onChange={(e) =>
                          updateConflictingModifier(index, e.target.value)
                        }
                        placeholder={`Modifier ${index + 1} (e.g., 95, GT)`}
                        className="flex-1"
                      />
                      {conflictRuleForm.conflictingModifiers.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeConflictingModifier(index)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  )
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addConflictingModifier}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Modifier
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Strategy</Label>
              <div className="w-full">
                <Select
                  value={conflictRuleForm.resolution}
                  onValueChange={(value) =>
                    handleConflictRuleFormChange("resolution", value)
                  }
                >
                  <SelectTrigger id="resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remove_conflicting">
                      Remove Conflicting - Remove all conflicting modifiers
                    </SelectItem>
                    <SelectItem value="prefer_first">
                      Prefer First - Keep the first modifier found
                    </SelectItem>
                    <SelectItem value="prefer_last">
                      Prefer Last - Keep the last modifier found
                    </SelectItem>
                    <SelectItem value="block_submission">
                      Block Submission - Prevent claim submission
                    </SelectItem>
                    <SelectItem value="manual_review">
                      Manual Review - Flag for human review
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-description">Description (Optional)</Label>
              <Input
                id="rule-description"
                type="text"
                value={conflictRuleForm.description}
                onChange={(e) =>
                  handleConflictRuleFormChange("description", e.target.value)
                }
                placeholder="Brief explanation of when this rule applies"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rule-enabled"
                checked={conflictRuleForm.enabled}
                onCheckedChange={(checked) =>
                  handleConflictRuleFormChange("enabled", checked)
                }
              />
              <Label htmlFor="rule-enabled" className="text-sm">
                Enable this rule immediately
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConflictRuleModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConflictRule}
              disabled={
                !conflictRuleForm.name ||
                conflictRuleForm.conflictingModifiers.filter((m) => m.trim())
                  .length < 2
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {editingConflictRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CPT Rule Modal */}
      <Dialog open={showCptRuleModal} onOpenChange={setShowCptRuleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Add Time-Based CPT Rule
            </DialogTitle>
            <DialogDescription>
              Configure time requirements for a specific CPT code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cpt-code">CPT Code</Label>
              <Input
                id="cpt-code"
                type="text"
                value={cptRuleForm.cptCode}
                onChange={(e) =>
                  handleCptRuleFormChange("cptCode", e.target.value)
                }
                placeholder="e.g., 99213, 99214"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpt-description">Description</Label>
              <Input
                id="cpt-description"
                type="text"
                value={cptRuleForm.description}
                onChange={(e) =>
                  handleCptRuleFormChange("description", e.target.value)
                }
                placeholder="e.g., Office Visit, Level 3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="min-minutes">Minimum Minutes</Label>
                <Input
                  id="min-minutes"
                  type="number"
                  min="0"
                  value={cptRuleForm.minMinutes}
                  onChange={(e) =>
                    handleCptRuleFormChange(
                      "minMinutes",
                      Number(e.target.value)
                    )
                  }
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-minutes">Maximum Minutes</Label>
                <Input
                  id="max-minutes"
                  type="number"
                  min="0"
                  value={cptRuleForm.maxMinutes}
                  onChange={(e) =>
                    handleCptRuleFormChange(
                      "maxMinutes",
                      Number(e.target.value)
                    )
                  }
                  className="text-center"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="flag-if-not-documented"
                checked={cptRuleForm.flagIfNotDocumented}
                onCheckedChange={(checked) =>
                  handleCptRuleFormChange("flagIfNotDocumented", checked)
                }
              />
              <Label htmlFor="flag-if-not-documented" className="text-sm">
                Flag for review if time not documented
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cpt-enabled"
                checked={cptRuleForm.enabled}
                onCheckedChange={(checked) =>
                  handleCptRuleFormChange("enabled", checked)
                }
              />
              <Label htmlFor="cpt-enabled" className="text-sm">
                Enable this rule immediately
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCptRuleModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCptRule}
              disabled={!cptRuleForm.cptCode || !cptRuleForm.description}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Denial Rule Modal */}
      <Dialog
        open={showCustomRuleDialog}
        onOpenChange={setShowCustomRuleDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-primary" />
              Add Custom Denial Rule
            </DialogTitle>
            <DialogDescription>
              Create a custom rule for handling specific denial codes
              (CARC/RARC).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="denial-code">Denial Code</Label>
              <Input
                id="denial-code"
                type="text"
                value={customRuleForm.code}
                onChange={(e) =>
                  handleCustomRuleFormChange("code", e.target.value)
                }
                placeholder="e.g., CARC 24, RARC 149"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="denial-description">Description</Label>
              <Input
                id="denial-description"
                type="text"
                value={customRuleForm.description}
                onChange={(e) =>
                  handleCustomRuleFormChange("description", e.target.value)
                }
                placeholder="e.g., Charges are covered under a capitation agreement"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="denial-strategy">Resolution Strategy</Label>
              <Input
                id="denial-strategy"
                type="text"
                value={customRuleForm.strategy}
                onChange={(e) =>
                  handleCustomRuleFormChange("strategy", e.target.value)
                }
                placeholder="e.g., Check contract status, flag for manual review"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-fix-enabled"
                checked={customRuleForm.autoFix}
                onCheckedChange={(checked) =>
                  handleCustomRuleFormChange("autoFix", checked)
                }
              />
              <Label htmlFor="auto-fix-enabled" className="text-sm">
                Enable auto-fix for this denial code
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-rule-enabled"
                checked={customRuleForm.enabled}
                onCheckedChange={(checked) =>
                  handleCustomRuleFormChange("enabled", checked)
                }
              />
              <Label htmlFor="custom-rule-enabled" className="text-sm">
                Enable this rule immediately
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomRuleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomRule}
              disabled={
                !customRuleForm.code ||
                !customRuleForm.description ||
                !customRuleForm.strategy
              }
            >
              <Save className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payer Override Rule Modal */}
      <Dialog
        open={showPayerOverrideDialog}
        onOpenChange={setShowPayerOverrideDialog}
      >
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              {editingPayerRule
                ? "Edit Payer Override Rule"
                : "Add Payer Override Rule"}
            </DialogTitle>
            <DialogDescription>
              {editingPayerRule
                ? "Update the validation rules for this payer."
                : "Create custom validation rules for specific payers to override default system behavior."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-1">
            {/* Payer Selection */}
            <div className="space-y-2">
              <Label htmlFor="payerName">Payer Name</Label>
              <Select
                value={payerOverrideForm.payerName}
                onValueChange={(value) =>
                  setPayerOverrideForm((prev) => ({
                    ...prev,
                    payerName: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a payer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthem">Anthem</SelectItem>
                  <SelectItem value="aetna">Aetna</SelectItem>
                  <SelectItem value="cigna">Cigna</SelectItem>
                  <SelectItem value="unitedhealth">UnitedHealth</SelectItem>
                  <SelectItem value="humana">Humana</SelectItem>
                  <SelectItem value="bcbs">Blue Cross Blue Shield</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={payerOverrideForm.ruleName}
                onChange={(e) =>
                  setPayerOverrideForm((prev) => ({
                    ...prev,
                    ruleName: e.target.value,
                  }))
                }
                placeholder="e.g., Telehealth Modifier Requirements"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={payerOverrideForm.description}
                onChange={(e) =>
                  setPayerOverrideForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this rule does"
              />
            </div>

            {/* Rule Type */}
            <div className="space-y-2">
              <Label htmlFor="ruleType">Rule Type</Label>
              <Select
                value={payerOverrideForm.ruleType}
                onValueChange={(
                  value: "validation" | "field_mapping" | "modifier" | "pos"
                ) =>
                  setPayerOverrideForm((prev) => ({ ...prev, ruleType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="validation">Validation Rule</SelectItem>
                  <SelectItem value="field_mapping">Field Mapping</SelectItem>
                  <SelectItem value="modifier">Modifier Rule</SelectItem>
                  <SelectItem value="pos">Place of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic fields based on rule type */}
            {payerOverrideForm.ruleType === "validation" && (
              <>
                {/* Conditions */}
                <div className="space-y-2">
                  <Label>Validation Conditions</Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Define when this validation rule should apply
                  </p>
                  {payerOverrideForm.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={condition}
                        onChange={(e) =>
                          updatePayerCondition(index, e.target.value)
                        }
                        placeholder="e.g., CPT code is 99213-99215"
                      />
                      {payerOverrideForm.conditions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePayerCondition(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPayerCondition}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Condition
                  </Button>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Label>Validation Actions</Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Define what should happen when conditions are met
                  </p>
                  {payerOverrideForm.actions.map((action, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={action}
                        onChange={(e) =>
                          updatePayerAction(index, e.target.value)
                        }
                        placeholder="e.g., Block submission, Flag for review"
                      />
                      {payerOverrideForm.actions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePayerAction(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPayerAction}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </>
            )}

            {payerOverrideForm.ruleType === "field_mapping" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sourceField">Source Field</Label>
                  <Select
                    value={payerOverrideForm.conditions[0] || ""}
                    onValueChange={(value) =>
                      setPayerOverrideForm((prev) => ({
                        ...prev,
                        conditions: [value],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field to map" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider_id">Provider ID</SelectItem>
                      <SelectItem value="diagnosis_code">
                        Diagnosis Code
                      </SelectItem>
                      <SelectItem value="service_date">Service Date</SelectItem>
                      <SelectItem value="place_of_service">
                        Place of Service
                      </SelectItem>
                      <SelectItem value="modifiers">Modifiers</SelectItem>
                      <SelectItem value="authorization_number">
                        Authorization Number
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mappingRule">Mapping Rule</Label>
                  <Input
                    id="mappingRule"
                    value={payerOverrideForm.actions[0] || ""}
                    onChange={(e) =>
                      setPayerOverrideForm((prev) => ({
                        ...prev,
                        actions: [e.target.value],
                      }))
                    }
                    placeholder="e.g., Use Tax ID instead of NPI"
                  />
                </div>
              </>
            )}

            {payerOverrideForm.ruleType === "modifier" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="modifierConditions">When to Apply</Label>
                  <Input
                    id="modifierConditions"
                    value={payerOverrideForm.conditions[0] || ""}
                    onChange={(e) =>
                      setPayerOverrideForm((prev) => ({
                        ...prev,
                        conditions: [e.target.value],
                      }))
                    }
                    placeholder="e.g., Telehealth visits, CPT 99213-99215"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modifierActions">Required Modifiers</Label>
                  <Input
                    id="modifierActions"
                    value={payerOverrideForm.actions[0] || ""}
                    onChange={(e) =>
                      setPayerOverrideForm((prev) => ({
                        ...prev,
                        actions: [e.target.value],
                      }))
                    }
                    placeholder="e.g., Require modifier 95, Block modifier GT"
                  />
                </div>
              </>
            )}

            {payerOverrideForm.ruleType === "pos" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="posConditions">Visit Type</Label>
                  <Select
                    value={payerOverrideForm.conditions[0] || ""}
                    onValueChange={(value) =>
                      setPayerOverrideForm((prev) => ({
                        ...prev,
                        conditions: [value],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                      <SelectItem value="in_person">In-Person</SelectItem>
                      <SelectItem value="home_visit">Home Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredPOS">Required POS Code</Label>
                  <Select
                    value={payerOverrideForm.actions[0] || ""}
                    onValueChange={(value) =>
                      setPayerOverrideForm((prev) => ({
                        ...prev,
                        actions: [value],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select POS code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">
                        10 - Telehealth (Patient&apos;s Home)
                      </SelectItem>
                      <SelectItem value="02">
                        02 - Telehealth (Other Location)
                      </SelectItem>
                      <SelectItem value="11">11 - Office</SelectItem>
                      <SelectItem value="12">12 - Home</SelectItem>
                      <SelectItem value="22">
                        22 - On Campus-Outpatient Hospital
                      </SelectItem>
                      <SelectItem value="19">
                        19 - Off Campus-Outpatient Hospital
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Enable Rule */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabledOverride"
                checked={payerOverrideForm.enabled}
                onCheckedChange={(checked) =>
                  setPayerOverrideForm((prev) => ({
                    ...prev,
                    enabled: !!checked,
                  }))
                }
              />
              <Label htmlFor="enabledOverride">
                Enable this rule immediately
              </Label>
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowPayerOverrideDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePayerOverride}
              disabled={
                !payerOverrideForm.payerName ||
                !payerOverrideForm.ruleName ||
                !payerOverrideForm.description
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {editingPayerRule
                ? "Update Override Rule"
                : "Create Override Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payer Configuration Dialog */}
      <Dialog
        open={showPayerConfigDialog}
        onOpenChange={setShowPayerConfigDialog}
      >
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              Configure {selectedPayer}
            </DialogTitle>
            <DialogDescription>
              Configure connection settings and authentication for{" "}
              {selectedPayer}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                type="url"
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-type">Authentication Type</Label>
              <Select value={authType} onValueChange={setAuthType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="username_password">
                    Username/Password
                  </SelectItem>
                  <SelectItem value="client_cert">
                    Client Certificate
                  </SelectItem>
                  <SelectItem value="bearer_token">Bearer Token</SelectItem>
                  <SelectItem value="x12_edi">X12 EDI Credentials</SelectItem>
                  <SelectItem value="saml_sso">SAML/SSO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* API Key Authentication */}
            {authType === "api_key" && (
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter API key"
                />
              </div>
            )}

            {/* OAuth 2.0 Authentication */}
            {authType === "oauth2" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    type="text"
                    placeholder="Enter OAuth client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder="Enter OAuth client secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-url">Authorization URL</Label>
                  <Input
                    id="auth-url"
                    type="url"
                    placeholder="https://auth.example.com/oauth/authorize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token-url">Token URL</Label>
                  <Input
                    id="token-url"
                    type="url"
                    placeholder="https://auth.example.com/oauth/token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Input
                    id="scope"
                    type="text"
                    placeholder="read write claims"
                  />
                </div>
              </>
            )}

            {/* Username/Password Authentication */}
            {authType === "username_password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}

            {/* Client Certificate Authentication */}
            {authType === "client_cert" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cert-file">
                    Certificate File (.p12/.pfx)
                  </Label>
                  <Input id="cert-file" type="file" accept=".p12,.pfx,.pem" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-password">Certificate Password</Label>
                  <Input
                    id="cert-password"
                    type="password"
                    placeholder="Enter certificate password"
                  />
                </div>
              </>
            )}

            {/* Bearer Token Authentication */}
            {authType === "bearer_token" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bearer-token">Bearer Token</Label>
                  <Input
                    id="bearer-token"
                    type="password"
                    placeholder="Enter bearer token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token-expiry">Token Expiry (days)</Label>
                  <Input
                    id="token-expiry"
                    type="number"
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                </div>
              </>
            )}

            {/* X12 EDI Credentials */}
            {authType === "x12_edi" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edi-interchange-id">Interchange ID</Label>
                  <Input
                    id="edi-interchange-id"
                    type="text"
                    placeholder="Enter interchange ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edi-application-id">Application ID</Label>
                  <Input
                    id="edi-application-id"
                    type="text"
                    placeholder="Enter application ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edi-submission-url">Submission URL</Label>
                  <Input
                    id="edi-submission-url"
                    type="url"
                    placeholder="https://edi.example.com/submit"
                  />
                </div>
              </>
            )}

            {/* SAML/SSO Authentication */}
            {authType === "saml_sso" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sso-url">SSO URL</Label>
                  <Input
                    id="sso-url"
                    type="url"
                    placeholder="https://sso.example.com/saml"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity-id">Entity ID</Label>
                  <Input
                    id="entity-id"
                    type="text"
                    placeholder="Enter SAML entity ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-fingerprint">
                    Certificate Fingerprint
                  </Label>
                  <Input
                    id="cert-fingerprint"
                    type="text"
                    placeholder="SHA256 fingerprint"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                defaultValue="30"
                min="10"
                max="300"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="enable-retry" defaultChecked />
              <Label htmlFor="enable-retry" className="text-sm">
                Enable automatic retry on connection failure
              </Label>
            </div>

            {/* Test Connection */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Test Connection
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Verify your authentication settings
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Test
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowPayerConfigDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowPayerConfigDialog(false)}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Mapping Dialog */}
      <Dialog
        open={showFieldMappingDialog}
        onOpenChange={setShowFieldMappingDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-primary" />
              {editingFieldMappingIndex !== null
                ? "Edit Field Mapping"
                : "Add Field Mapping"}
            </DialogTitle>
            <DialogDescription>
              {editingFieldMappingIndex !== null
                ? "Update the field mapping rule for this payer."
                : "Create a custom field mapping rule for a specific payer."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mapping-payer">Payer</Label>
              <Select
                value={fieldMappingForm.payer}
                onValueChange={(value) =>
                  setFieldMappingForm((prev) => ({ ...prev, payer: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a payer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aetna">Aetna</SelectItem>
                  <SelectItem value="anthem">Anthem</SelectItem>
                  <SelectItem value="cigna">Cigna</SelectItem>
                  <SelectItem value="unitedhealth">UnitedHealthcare</SelectItem>
                  <SelectItem value="humana">Humana</SelectItem>
                  <SelectItem value="bcbs">Blue Cross Blue Shield</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapping-field">Field Name</Label>
              <Select
                value={fieldMappingForm.field}
                onValueChange={(value) =>
                  setFieldMappingForm((prev) => ({ ...prev, field: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider-id">Provider ID</SelectItem>
                  <SelectItem value="diagnosis-code">Diagnosis Code</SelectItem>
                  <SelectItem value="service-date">Service Date</SelectItem>
                  <SelectItem value="place-of-service">
                    Place of Service
                  </SelectItem>
                  <SelectItem value="modifiers">Modifiers</SelectItem>
                  <SelectItem value="authorization-number">
                    Authorization Number
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapping-rule">Mapping Rule</Label>
              <Input
                id="mapping-rule"
                value={fieldMappingForm.mapping}
                onChange={(e) =>
                  setFieldMappingForm((prev) => ({
                    ...prev,
                    mapping: e.target.value,
                  }))
                }
                placeholder="Describe how this field should be mapped"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mapping-enabled"
                checked={fieldMappingForm.enabled}
                onCheckedChange={(checked) =>
                  setFieldMappingForm((prev) => ({
                    ...prev,
                    enabled: !!checked,
                  }))
                }
              />
              <Label htmlFor="mapping-enabled" className="text-sm">
                Enable this mapping immediately
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFieldMappingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFieldMapping}
              disabled={
                !fieldMappingForm.payer ||
                !fieldMappingForm.field ||
                !fieldMappingForm.mapping
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {editingFieldMappingIndex !== null
                ? "Update Mapping"
                : "Save Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Mapping Confirmation Dialog */}
      <Dialog
        open={showDeleteMappingDialog}
        onOpenChange={setShowDeleteMappingDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Delete Field Mapping
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this field mapping? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {mappingToDelete !== null && (
            <div className="py-4">
              <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
                <p className="font-medium text-red-900 dark:text-red-100">
                  {fieldMappings[mappingToDelete]?.payer} -{" "}
                  {fieldMappings[mappingToDelete]?.field}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {fieldMappings[mappingToDelete]?.mapping}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteMappingDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMapping}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Modal */}
      <Dialog open={showRemoveUserModal} onOpenChange={setShowRemoveUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-red-600" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToRemove?.name} from the
              team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveUserModal(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveUser}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DoseSpot Credential Modal */}
      <Dialog open={showDosespotModal} onOpenChange={setShowDosespotModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-primary" />
              {editingDosespotIndex !== null ? "Edit DoseSpot Credentials" : "Add DoseSpot Credentials"}
            </DialogTitle>
            <DialogDescription>
              {editingDosespotIndex !== null
                ? "Update your DoseSpot API credentials for eRx and ePA processing."
                : "Enter your DoseSpot API credentials to enable eRx and ePA processing features."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dosespot-name">Configuration Name</Label>
              <Input
                id="dosespot-name"
                type="text"
                value={dosespotFormData.credentialName}
                onChange={(e) =>
                  setDosespotFormData(prev => ({ ...prev, credentialName: e.target.value }))
                }
                placeholder="e.g., Production DoseSpot"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosespot-environment">Environment</Label>
              <Select
                value={dosespotFormData.environment}
                onValueChange={(value) =>
                  setDosespotFormData(prev => ({ ...prev, environment: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosespot-apikey">API Key</Label>
              <Input
                id="dosespot-apikey"
                type="password"
                value={dosespotFormData.credentials.apiKey}
                onChange={(e) =>
                  setDosespotFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, apiKey: e.target.value }
                  }))
                }
                placeholder="Enter your DoseSpot API key"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosespot-clinickey">Clinic Key</Label>
              <Input
                id="dosespot-clinickey"
                type="password"
                value={dosespotFormData.credentials.clinicKey}
                onChange={(e) =>
                  setDosespotFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, clinicKey: e.target.value }
                  }))
                }
                placeholder="Enter your clinic key"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosespot-clinicid">Clinic ID</Label>
              <Input
                id="dosespot-clinicid"
                type="text"
                value={dosespotFormData.credentials.clinicId}
                onChange={(e) =>
                  setDosespotFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, clinicId: e.target.value }
                  }))
                }
                placeholder="Enter your clinic ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosespot-userid">User ID</Label>
              <Input
                id="dosespot-userid"
                type="text"
                value={dosespotFormData.credentials.userId}
                onChange={(e) =>
                  setDosespotFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, userId: e.target.value }
                  }))
                }
                placeholder="Enter your user ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosespot-subscriptionkey">Subscription Key</Label>
              <Input
                id="dosespot-subscriptionkey"
                type="password"
                value={dosespotFormData.credentials.subscriptionKey}
                onChange={(e) =>
                  setDosespotFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, subscriptionKey: e.target.value }
                  }))
                }
                placeholder="Enter your subscription key"
                required
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    HIPAA Compliance
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Credentials are encrypted and stored securely in AWS Secrets Manager.
                    All operations are logged for audit compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDosespotModal(false);
                setEditingDosespotIndex(null);
                setDosespotFormData({
                  credentialName: '',
                  description: '',
                  serviceName: 'dosespot',
                  serviceType: 'erx',
                  environment: 'sandbox',
                  enabledFeatures: ['erx'],
                  connectionSettings: {
                    timeout: 30000,
                    retryAttempts: 3,
                    retryDelay: 1000,
                  },
                  autoRenew: false,
                  expiresAt: '',
                  credentials: {
                    apiKey: '',
                    clinicKey: '',
                    clinicId: '',
                    userId: '',
                    subscriptionKey: '',
                  },
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDosespotCredential}
              disabled={
                !dosespotFormData.credentialName ||
                !dosespotFormData.credentials.apiKey ||
                !dosespotFormData.credentials.clinicKey ||
                !dosespotFormData.credentials.clinicId ||
                !dosespotFormData.credentials.userId ||
                !dosespotFormData.credentials.subscriptionKey
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {editingDosespotIndex !== null ? "Update Credentials" : "Save Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading fallback component
function SettingsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64">
          <Card className="p-4">
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </Card>
        </div>
        <div className="flex-1">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component with Suspense boundary
export default function SettingsClient({
  teamSlug,
  initialAutomationSettings,
  initialNotificationSettings,
  initialValidationSettings,
  initialOrganizationData,
}: Readonly<SettingsProps>) {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent
        teamSlug={teamSlug}
        initialAutomationSettings={initialAutomationSettings}
        initialNotificationSettings={initialNotificationSettings}
        initialValidationSettings={initialValidationSettings}
        initialOrganizationData={initialOrganizationData}
      />
    </Suspense>
  );
}
