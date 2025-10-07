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
  UserPlus,
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
} from "lucide-react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import Link from "next/link";

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

interface SettingsProps {
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
}

const settingsSections: SettingsSection[] = [
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
  initialAutomationSettings,
  initialNotificationSettings,
  initialValidationSettings,
}: SettingsProps) {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState("automation");
  const [hasChanges, setHasChanges] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "PA Coordinator",
    sendWelcomeEmail: true,
  });

  const [showEditModal, setShowEditModal] = useState(false);
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
      retentionPeriod: "1 year",
    },
  };

  const [validationSettings, setValidationSettings] = useState(
    initialValidationSettings || defaultValidationSettings
  );

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
    cmm: { connected: true, lastSync: "2 minutes ago", status: "healthy" },
    supabase: { connected: true, lastSync: "Real-time", status: "healthy" },
    gemini: { connected: true, lastSync: "1 minute ago", status: "healthy" },
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

  // Built-in denial rules state
  const [builtInDenialRules, setBuiltInDenialRules] = useState({
    carc96: { enabled: true, autoFix: true },
    carc11: { enabled: true, autoFix: false },
    carc197: { enabled: true, autoFix: true },
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

  const handleInviteUser = () => {
    console.log("Inviting user:", inviteForm);
    setInviteForm({
      email: "",
      firstName: "",
      lastName: "",
      role: "PA Coordinator",
      sendWelcomeEmail: true,
    });
    setShowInviteModal(false);
    alert(`Invitation sent to ${inviteForm.email}`);
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

  const updateCptRule = (index: number, updatedRule: any) => {
    const existingRules =
      validationSettings.timeBasedValidation?.cptRules || [];
    const updatedRules = [...existingRules];
    updatedRules[index] = { ...updatedRules[index], ...updatedRule };

    handleSettingChange("validation", "timeBasedValidation", {
      ...validationSettings.timeBasedValidation,
      cptRules: updatedRules,
    });
  };

  const removeCptRule = (index: number) => {
    const existingRules =
      validationSettings.timeBasedValidation?.cptRules || [];
    const updatedRules = existingRules.filter((_, i) => i !== index);

    handleSettingChange("validation", "timeBasedValidation", {
      ...validationSettings.timeBasedValidation,
      cptRules: updatedRules,
    });
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

  const removeCustomRule = (index: number) => {
    const existingRules = validationSettings.denialPlaybook?.customRules || [];
    const updatedRules = existingRules.filter((_, i) => i !== index);

    handleSettingChange("validation", "denialPlaybook", {
      ...validationSettings.denialPlaybook,
      customRules: updatedRules,
    });
  };

  const updateCustomRule = (index: number, updatedRule: any) => {
    const existingRules = validationSettings.denialPlaybook?.customRules || [];
    const updatedRules = [...existingRules];
    updatedRules[index] = { ...updatedRules[index], ...updatedRule };

    handleSettingChange("validation", "denialPlaybook", {
      ...validationSettings.denialPlaybook,
      customRules: updatedRules,
    });
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

    if (editingFieldMappingIndex !== null) {
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

  const renderAutomationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Global Confidence Threshold
        </h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Global Confidence Threshold
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Items below this threshold will surface for human review.
                  Higher percentage = stricter automation.
                </p>
              </div>
              <div className="flex items-center gap-4 min-w-[280px]">
                <Slider
                  value={[automationSettings.globalConfidenceThreshold || 88]}
                  onValueChange={(value) =>
                    handleSettingChange(
                      "automation",
                      "globalConfidenceThreshold",
                      value[0]
                    )
                  }
                  max={98}
                  min={60}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums min-w-[3.5ch]">
                  {automationSettings.globalConfidenceThreshold || 88}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Auto-Submission Controls
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Auto-Submission for Claims
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically submit claims that meet confidence threshold and
                pass all validation rules
              </p>
            </div>
            <Switch
              checked={automationSettings.enableAutoSubmission || false}
              onCheckedChange={(checked) =>
                handleSettingChange(
                  "automation",
                  "enableAutoSubmission",
                  checked
                )
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Auto-Approval for ePAs
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically approve prior authorizations that meet confidence
                threshold
              </p>
            </div>
            <Switch
              checked={automationSettings.enableAutoEPA || false}
              onCheckedChange={(checked) =>
                handleSettingChange("automation", "enableAutoEPA", checked)
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-8 mb-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Field-Level Confidence Minimums
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Minimum confidence required for individual fields before
              auto-submission
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              CPT Code
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={
                  automationSettings.fieldConfidenceThresholds?.cptCode || 85
                }
                onChange={(e) =>
                  handleSettingChange(
                    "automation",
                    "fieldConfidenceThresholds",
                    {
                      ...automationSettings.fieldConfidenceThresholds,
                      cptCode: Number(e.target.value),
                    }
                  )
                }
                className="w-16 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ICD-10
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={
                  automationSettings.fieldConfidenceThresholds?.icd10 || 85
                }
                onChange={(e) =>
                  handleSettingChange(
                    "automation",
                    "fieldConfidenceThresholds",
                    {
                      ...automationSettings.fieldConfidenceThresholds,
                      icd10: Number(e.target.value),
                    }
                  )
                }
                className="w-16 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Place of Service
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={
                  automationSettings.fieldConfidenceThresholds
                    ?.placeOfService || 90
                }
                onChange={(e) =>
                  handleSettingChange(
                    "automation",
                    "fieldConfidenceThresholds",
                    {
                      ...automationSettings.fieldConfidenceThresholds,
                      placeOfService: Number(e.target.value),
                    }
                  )
                }
                className="w-16 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Modifiers
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={
                  automationSettings.fieldConfidenceThresholds?.modifiers || 80
                }
                onChange={(e) =>
                  handleSettingChange(
                    "automation",
                    "fieldConfidenceThresholds",
                    {
                      ...automationSettings.fieldConfidenceThresholds,
                      modifiers: Number(e.target.value),
                    }
                  )
                }
                className="w-16 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Processing Rules
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Bulk Processing</Label>
              <p className="text-sm text-muted-foreground">
                Process multiple PAs simultaneously
              </p>
            </div>
            <Switch
              checked={automationSettings.enableBulkProcessing}
              onCheckedChange={(checked) =>
                handleSettingChange(
                  "automation",
                  "enableBulkProcessing",
                  checked
                )
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Confidence Score Display</Label>
              <p className="text-sm text-muted-foreground">
                Show AI confidence scores in UI
              </p>
            </div>
            <Switch
              checked={automationSettings.confidenceScoreEnabled}
              onCheckedChange={(checked) =>
                handleSettingChange(
                  "automation",
                  "confidenceScoreEnabled",
                  checked
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Max Retry Attempts</Label>
            <div className="w-full">
              <Select
                value={automationSettings.maxRetryAttempts.toString()}
                onValueChange={(value) =>
                  handleSettingChange(
                    "automation",
                    "maxRetryAttempts",
                    Number(value)
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="2">2 attempts</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderVisitTypesSettings = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported Visit Types
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <Checkbox
              checked={validationSettings.visitTypes?.telehealth || false}
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "visitTypes", {
                  ...validationSettings.visitTypes,
                  telehealth: !!checked,
                })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Telemedicine / Telehealth
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Remote video visits with patients
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <Checkbox
              checked={validationSettings.visitTypes?.inPerson || false}
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "visitTypes", {
                  ...validationSettings.visitTypes,
                  inPerson: !!checked,
                })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                In-Person / Office Visits
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Patient visits your office location
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <Checkbox
              checked={validationSettings.visitTypes?.home || false}
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "visitTypes", {
                  ...validationSettings.visitTypes,
                  home: !!checked,
                })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Home Visits
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Provider travels to patient&apos;s home
              </div>
            </div>
          </label>
        </div>
      </Card>

      {/* Telemedicine POS Rules (conditional) */}
      {validationSettings.visitTypes?.telehealth && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Telemedicine Place of Service (POS) Rules
            </Label>
            <Switch
              checked={
                validationSettings.posRules?.enforceTelehealthPOS || false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "posRules", {
                  ...validationSettings.posRules,
                  enforceTelehealthPOS: checked,
                })
              }
            />
          </div>

          {validationSettings.posRules?.enforceTelehealthPOS && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Required POS Code
                  </Label>
                  <div className="w-full">
                    <Select defaultValue="10">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">
                          10 - Telehealth (Patient&apos;s Home)
                        </SelectItem>
                        <SelectItem value="02">
                          02 - Telehealth (Other Location)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Alternative POS Code
                  </Label>
                  <div className="w-full">
                    <Select defaultValue="">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="02">
                          02 - Telehealth (Other Location)
                        </SelectItem>
                        <SelectItem value="10">
                          10 - Telehealth (Patient&apos;s Home)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Block submission if POS doesn&apos;t match visit type
                </span>
              </label>
            </div>
          )}
        </Card>
      )}

      {/* In-Person POS Rules (conditional) */}
      {validationSettings.visitTypes?.inPerson && (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              In-Person Place of Service (POS) Rules
            </Label>
            <Switch
              checked={validationSettings.posRules?.enforceInPersonPOS || false}
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "posRules", {
                  ...validationSettings.posRules,
                  enforceInPersonPOS: checked,
                })
              }
            />
          </div>

          {validationSettings.posRules?.enforceInPersonPOS && (
            <div className="space-y-4">
              <div className="flex-1">
                <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Required POS Code
                </Label>
                <div className="max-w-md">
                  <Select defaultValue="11">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11 - Office</SelectItem>
                      <SelectItem value="22">
                        22 - On Campus-Outpatient Hospital
                      </SelectItem>
                      <SelectItem value="19">
                        19 - Off Campus-Outpatient Hospital
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Block submission if POS doesn&apos;t match visit type
                </span>
              </label>
            </div>
          )}
        </Card>
      )}

      {/* Home Visit POS Rules (conditional) */}
      {validationSettings.visitTypes?.home && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Home Visit Place of Service (POS) Rules
            </Label>
            <Switch
              checked={validationSettings.posRules?.enforceHomePOS || false}
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "posRules", {
                  ...validationSettings.posRules,
                  enforceHomePOS: checked,
                })
              }
            />
          </div>

          {validationSettings.posRules?.enforceHomePOS && (
            <div className="space-y-4">
              <div className="flex-1">
                <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Required POS Code
                </Label>
                <div className="max-w-md">
                  <Select defaultValue="12">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 - Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Block submission if POS doesn&apos;t match visit type
                </span>
              </label>
            </div>
          )}
        </Card>
      )}
    </div>
  );

  const renderModifiersSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Modifier 95 Rules
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Require Modifier 95 for Telehealth
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically enforce Modifier 95 requirement for all telehealth
                visits
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules?.modifier95Required || false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "modifierRules", {
                  ...validationSettings.modifierRules,
                  modifier95Required: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Auto-Add Modifier 95
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically add Modifier 95 to telehealth claims when missing
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules?.autoAddModifier95 || false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "modifierRules", {
                  ...validationSettings.modifierRules,
                  autoAddModifier95: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Modifier 95 Conflict Resolution
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically resolve conflicts when Modifier 95 is already
                present
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules
                  ?.modifier95ConflictResolution || false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "modifierRules", {
                  ...validationSettings.modifierRules,
                  modifier95ConflictResolution: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          General Modifier Validation
        </h3>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 block">
                Validation Rules
              </Label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <Checkbox
                    checked={
                      validationSettings.modifierRules
                        ?.validateModifierCombinations || false
                    }
                    onCheckedChange={(checked) =>
                      handleSettingChange("validation", "modifierRules", {
                        ...validationSettings.modifierRules,
                        validateModifierCombinations: !!checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Validate Modifier Combinations
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Check for invalid or conflicting modifier combinations
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <Checkbox
                    checked={
                      validationSettings.modifierRules
                        ?.requireModifierDocumentation || false
                    }
                    onCheckedChange={(checked) =>
                      handleSettingChange("validation", "modifierRules", {
                        ...validationSettings.modifierRules,
                        requireModifierDocumentation: !!checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Require Modifier Documentation
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Ensure clinical notes support the use of specific
                      modifiers
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <Checkbox
                    checked={
                      validationSettings.modifierRules?.blockInvalidModifiers ||
                      false
                    }
                    onCheckedChange={(checked) =>
                      handleSettingChange("validation", "modifierRules", {
                        ...validationSettings.modifierRules,
                        blockInvalidModifiers: !!checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Block Invalid Modifiers
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Prevent submission of claims with invalid modifier codes
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Custom Conflict Resolution Rules
          </h3>
          <Button
            size="sm"
            onClick={() => {
              setEditingConflictRule(null);
              setConflictRuleForm({
                name: "",
                conflictingModifiers: [""],
                resolution: "remove_conflicting",
                description: "",
                enabled: true,
              });
              setShowConflictRuleModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>

        <div className="space-y-3">
          {(validationSettings.modifierRules?.conflictRules || []).map(
            (rule, index) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        const updatedRules = [
                          ...(validationSettings.modifierRules?.conflictRules ||
                            []),
                        ];
                        updatedRules[index] = { ...rule, enabled: checked };
                        handleSettingChange("validation", "modifierRules", {
                          ...validationSettings.modifierRules,
                          conflictRules: updatedRules,
                        });
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Conflicts: {rule.conflictingModifiers.join(", ")} •
                        Resolution: {rule.resolution.replace("_", " ")}
                      </p>
                      {rule.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingConflictRule(rule);
                      setConflictRuleForm({
                        name: rule.name,
                        conflictingModifiers: rule.conflictingModifiers,
                        resolution: rule.resolution,
                        description: rule.description || "",
                        enabled: rule.enabled,
                      });
                      setShowConflictRuleModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedRules = (
                        validationSettings.modifierRules?.conflictRules || []
                      ).filter((_, i) => i !== index);
                      handleSettingChange("validation", "modifierRules", {
                        ...validationSettings.modifierRules,
                        conflictRules: updatedRules,
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )
          )}

          {(!validationSettings.modifierRules?.conflictRules ||
            validationSettings.modifierRules.conflictRules.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No conflict resolution rules configured</p>
              <p className="text-xs mt-1">
                Click &quot;Add Rule&quot; to create your first conflict
                resolution rule
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Payer-Specific Modifier Rules
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Payer-Specific Rules
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Apply different modifier rules based on insurance payer
                requirements
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules?.enablePayerSpecificRules ||
                false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "modifierRules", {
                  ...validationSettings.modifierRules,
                  enablePayerSpecificRules: checked,
                })
              }
            />
          </div>

          {validationSettings.modifierRules?.enablePayerSpecificRules && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Payer-Specific Configuration
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Configure payer-specific modifier rules in the{" "}
                    <strong>Payer Configuration</strong> section. This setting
                    enables the enforcement of those rules during claim
                    validation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderRequiredFieldsSettings = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Claims - Required Fields
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                CPT Code (Procedure)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                ICD-10 Code (Diagnosis)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Place of Service (POS)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Service Date (DOS)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Rendering Provider NPI
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Payer Information
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={true}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Modifiers
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
            >
              Conditionally Required
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Prior Authorization (ePA) - Required Fields
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Medication / Service Requested
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Clinical Indication / Diagnosis
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={true}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Prior Therapies Documented (Step Therapy)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
            >
              Conditionally Required
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Block Submission on Missing Required Fields
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Prevent auto-submission when any required field is missing or
              below confidence threshold
            </p>
          </div>
          <Switch
            checked={
              validationSettings.requiredFields?.blockOnMissingFields || false
            }
            onCheckedChange={(checked) =>
              handleSettingChange("validation", "requiredFields", {
                ...validationSettings.requiredFields,
                blockOnMissingFields: checked,
              })
            }
          />
        </div>
      </Card>
    </div>
  );

  const renderTimeBasedSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Label
            htmlFor="time-based-enabled"
            className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            Enable Time-Based Validation
          </Label>
          <Switch
            id="time-based-enabled"
            checked={validationSettings.timeBasedValidation?.enabled || false}
            onCheckedChange={(checked) =>
              handleSettingChange("validation", "timeBasedValidation", {
                ...validationSettings.timeBasedValidation,
                enabled: checked,
              })
            }
          />
        </div>
        <label htmlFor="extract-time-ai" className="flex items-center gap-2">
          <Checkbox
            id="extract-time-ai"
            checked={
              validationSettings.timeBasedValidation?.extractTimeFromNotes ||
              false
            }
            onCheckedChange={(checked) =>
              handleSettingChange("validation", "timeBasedValidation", {
                ...validationSettings.timeBasedValidation,
                extractTimeFromNotes: !!checked,
              })
            }
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Extract time documentation from clinical notes using AI
          </span>
        </label>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <Label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            E/M Code Time Requirements
          </Label>
          <Button size="sm" onClick={() => setShowCptRuleModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add CPT Rule
          </Button>
        </div>
        <div className="space-y-3">
          {(validationSettings.timeBasedValidation?.cptRules || []).map(
            (rule, index) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    CPT {rule.cptCode} - {rule.description}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        updateCptRule(index, { enabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCptRule(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor={`cpt-${rule.id}-range`}
                    className="text-xs text-slate-600 dark:text-slate-400"
                  >
                    Time Range:
                  </Label>
                  <Input
                    id={`cpt-${rule.id}-min`}
                    type="number"
                    value={rule.minMinutes}
                    onChange={(e) =>
                      updateCptRule(index, {
                        minMinutes: Number(e.target.value),
                      })
                    }
                    min="0"
                    className="w-20 text-center text-sm"
                  />
                  <span className="text-slate-400">to</span>
                  <Input
                    id={`cpt-${rule.id}-max`}
                    type="number"
                    value={rule.maxMinutes}
                    onChange={(e) =>
                      updateCptRule(index, {
                        maxMinutes: Number(e.target.value),
                      })
                    }
                    min="0"
                    className="w-20 text-center text-sm"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    minutes
                  </span>
                </div>
                <label
                  htmlFor={`cpt-${rule.id}-flag`}
                  className="flex items-center gap-2 mt-3"
                >
                  <Checkbox
                    id={`cpt-${rule.id}-flag`}
                    checked={rule.flagIfNotDocumented}
                    onCheckedChange={(checked) =>
                      updateCptRule(index, { flagIfNotDocumented: !!checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Flag for review if time not documented
                  </span>
                </label>
              </div>
            )
          )}

          {(!validationSettings.timeBasedValidation?.cptRules ||
            validationSettings.timeBasedValidation.cptRules.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No time-based CPT rules configured</p>
              <p className="text-xs mt-1">
                Click &quot;Add CPT Rule&quot; to create your first time-based
                validation rule
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderCredentialingSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Provider Credentialing Requirements
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="enforce-credentialing"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Enforce Credentialing
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Require valid credentialing before submission
              </p>
            </div>
            <Switch
              id="enforce-credentialing"
              checked={
                validationSettings.credentialingRules?.enforceCredentialing ||
                false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "credentialingRules", {
                  ...validationSettings.credentialingRules,
                  enforceCredentialing: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="multi-state-licensure"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Multi-State Licensure Validation (Telemedicine)
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Verify provider is licensed in patient&apos;s state of residence
              </p>
            </div>
            <Switch
              id="multi-state-licensure"
              checked={
                validationSettings.credentialingRules?.multiStateLicensure ||
                false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "credentialingRules", {
                  ...validationSettings.credentialingRules,
                  multiStateLicensure: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="credentialing-alerts"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Credentialing Alerts
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Show alerts for credentialing issues
              </p>
            </div>
            <Switch
              id="credentialing-alerts"
              checked={
                validationSettings.credentialingRules
                  ?.showCredentialingAlerts || false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "credentialingRules", {
                  ...validationSettings.credentialingRules,
                  showCredentialingAlerts: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Allowed Provider Statuses
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select which provider credentialing statuses are allowed for claim
            submission
          </p>

          <div className="space-y-3">
            {["Active", "Pending", "Provisional", "Inactive", "Suspended"].map(
              (status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <Checkbox
                    checked={
                      validationSettings.credentialingRules?.allowedStatuses?.includes(
                        status
                      ) || false
                    }
                    onCheckedChange={(checked) => {
                      const currentStatuses =
                        validationSettings.credentialingRules
                          ?.allowedStatuses || [];
                      const updatedStatuses = checked
                        ? [...currentStatuses, status]
                        : currentStatuses.filter((s) => s !== status);

                      handleSettingChange("validation", "credentialingRules", {
                        ...validationSettings.credentialingRules,
                        allowedStatuses: updatedStatuses,
                      });
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {status}
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {status === "Active" &&
                        "Provider is fully credentialed and active"}
                      {status === "Pending" && "Credentialing is in progress"}
                      {status === "Provisional" &&
                        "Temporary credentialing status"}
                      {status === "Inactive" &&
                        "Provider is not currently active"}
                      {status === "Suspended" &&
                        "Provider privileges are suspended"}
                    </div>
                  </div>
                  {status === "Active" && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Recommended
                    </Badge>
                  )}
                </label>
              )
            )}
          </div>

          {(!validationSettings.credentialingRules?.allowedStatuses ||
            validationSettings.credentialingRules.allowedStatuses.length ===
              0) && (
            <div className="text-center py-4 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium">
                No provider statuses selected
              </p>
              <p className="text-xs mt-1">
                Claims will be blocked until at least one status is allowed
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderDenialPlaybookSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Auto-Retry Configuration
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="auto-retry-enabled"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Enable Auto-Retry on Denials
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically fix and resubmit based on denial codes
              </p>
            </div>
            <Switch
              id="auto-retry-enabled"
              checked={
                validationSettings.denialPlaybook?.autoRetryEnabled || false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "denialPlaybook", {
                  ...validationSettings.denialPlaybook,
                  autoRetryEnabled: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-8">
          <div>
            <Label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Maximum Retry Attempts
            </Label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              How many times to auto-retry before requiring human review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max="10"
              value={validationSettings.denialPlaybook?.maxRetryAttempts || 3}
              onChange={(e) =>
                handleSettingChange("validation", "denialPlaybook", {
                  ...validationSettings.denialPlaybook,
                  maxRetryAttempts: Number(e.target.value),
                })
              }
              className="w-20 text-center"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              attempts
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Denial Code Auto-Fix Rules (CARC/RARC)
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCustomRuleDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Rule
          </Button>
        </div>

        <div className="space-y-3">
          {/* Display custom rules */}
          {(validationSettings.denialPlaybook?.customRules || []).map(
            (rule, index) => (
              <div
                key={rule.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {rule.code} - {rule.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        updateCustomRule(index, { enabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomRule(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Strategy:</span>{" "}
                    {rule.strategy}
                  </div>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={rule.autoFix}
                      onCheckedChange={(checked) =>
                        updateCustomRule(index, { autoFix: !!checked })
                      }
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Enable auto-fix for this denial code
                    </span>
                  </label>
                </div>
              </div>
            )
          )}

          {/* Built-in rules */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  CARC 96 - POS Inconsistent / Missing Modifier
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Success Rate:
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    87%
                  </span>
                </div>
              </div>
              <Switch
                checked={builtInDenialRules.carc96.enabled}
                onCheckedChange={(checked) =>
                  setBuiltInDenialRules((prev) => ({
                    ...prev,
                    carc96: { ...prev.carc96, enabled: checked },
                  }))
                }
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Strategy:</span> Set POS to 10,
                Add Modifier 95, Add documentation note
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={true}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Enable auto-fix for this denial code
                </span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  CARC 11 - Diagnosis Inconsistent with Procedure
                </div>
              </div>
              <Switch
                checked={builtInDenialRules.carc11.enabled}
                onCheckedChange={(checked) =>
                  setBuiltInDenialRules((prev) => ({
                    ...prev,
                    carc11: { ...prev.carc11, enabled: checked },
                  }))
                }
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Strategy:</span> Generate top 3
                ICD-10 alternatives, require human selection
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={builtInDenialRules.carc11.autoFix}
                  onCheckedChange={(checked) =>
                    setBuiltInDenialRules((prev) => ({
                      ...prev,
                      carc11: { ...prev.carc11, autoFix: !!checked },
                    }))
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Surface for human review (do not auto-fix)
                </span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  CARC 197 - Precertification/Authorization Absent
                </div>
              </div>
              <Switch
                checked={builtInDenialRules.carc197.enabled}
                onCheckedChange={(checked) =>
                  setBuiltInDenialRules((prev) => ({
                    ...prev,
                    carc197: { ...prev.carc197, enabled: checked },
                  }))
                }
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Strategy:</span> Check for
                existing PA, attach if found, otherwise initiate ePA workflow
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={builtInDenialRules.carc197.autoFix}
                  onCheckedChange={(checked) =>
                    setBuiltInDenialRules((prev) => ({
                      ...prev,
                      carc197: { ...prev.carc197, autoFix: !!checked },
                    }))
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Automatically initiate ePA workflow when PA missing
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Alert Preferences
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "emailAlerts",
              label: "Email Alerts",
              description: "Receive notifications via email",
            },
            {
              key: "approvalNotifications",
              label: "Approval Notifications",
              description: "Get notified when PAs are approved",
            },
            {
              key: "denialNotifications",
              label: "Denial Notifications",
              description: "Get notified when PAs are denied",
            },
            {
              key: "systemMaintenanceAlerts",
              label: "System Maintenance",
              description: "Alerts for system updates and maintenance",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={
                  notificationSettings[
                    item.key as keyof typeof notificationSettings
                  ]
                }
                onCheckedChange={(checked) =>
                  handleSettingChange("notifications", item.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Reports & Digests
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "weeklyReports",
              label: "Weekly Reports",
              description: "Comprehensive weekly performance reports",
            },
            {
              key: "dailyDigest",
              label: "Daily Digest",
              description: "Daily summary of PA activity",
            },
            {
              key: "slackIntegration",
              label: "Slack Integration",
              description: "Send notifications to Slack channels",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={
                  notificationSettings[
                    item.key as keyof typeof notificationSettings
                  ]
                }
                onCheckedChange={(checked) =>
                  handleSettingChange("notifications", item.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderDiagnosisValidationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          ICD-10 to CPT Validation
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Validate ICD-10 to CPT Compatibility
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Check that diagnosis codes support medical necessity for
                procedures
              </p>
            </div>
            <Switch
              checked={
                validationSettings.diagnosisValidation?.validateIcdToCpt ||
                false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "diagnosisValidation", {
                  ...validationSettings.diagnosisValidation,
                  validateIcdToCpt: checked,
                })
              }
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Medical Necessity Confidence Threshold
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI confidence required for diagnosis-procedure pairing to be
                  accepted
                </p>
              </div>
              <div className="flex items-center gap-4 min-w-[280px]">
                <Slider
                  value={[
                    validationSettings.diagnosisValidation
                      ?.medicalNecessityThreshold || 80,
                  ]}
                  onValueChange={([value]) =>
                    handleSettingChange("validation", "diagnosisValidation", {
                      ...validationSettings.diagnosisValidation,
                      medicalNecessityThreshold: value,
                    })
                  }
                  min={60}
                  max={98}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums min-w-[3.5ch]">
                  {validationSettings.diagnosisValidation
                    ?.medicalNecessityThreshold || 80}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Suggest Alternative Diagnoses
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When diagnosis doesn&apos;t match procedure, suggest compatible
                alternatives using AI
              </p>
            </div>
            <Switch
              checked={
                validationSettings.diagnosisValidation?.suggestAlternativeDx ||
                false
              }
              onCheckedChange={(checked) =>
                handleSettingChange("validation", "diagnosisValidation", {
                  ...validationSettings.diagnosisValidation,
                  suggestAlternativeDx: checked,
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPayerConfigurationSettings = () => (
    <div className="space-y-6">
      {/* Payer Connection Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Payer Connection Status
        </h3>
        <div className="space-y-4">
          {[
            {
              name: "Aetna",
              status: "Connected",
              lastSync: "2 hours ago",
              claims: "1,234",
            },
            {
              name: "Blue Cross Blue Shield",
              status: "Connected",
              lastSync: "1 hour ago",
              claims: "2,847",
            },
            {
              name: "UnitedHealthcare",
              status: "Disconnected",
              lastSync: "Never",
              claims: "0",
            },
            {
              name: "Cigna",
              status: "Connected",
              lastSync: "30 minutes ago",
              claims: "892",
            },
            {
              name: "Medicare",
              status: "Connected",
              lastSync: "45 minutes ago",
              claims: "3,156",
            },
          ].map((payer) => (
            <div
              key={payer.name}
              className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    payer.status === "Connected" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {payer.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Last sync: {payer.lastSync} • {payer.claims} claims
                    processed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    payer.status === "Connected" ? "default" : "secondary"
                  }
                >
                  {payer.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigurePayer(payer.name)}
                >
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payer-Specific Rules & Overrides */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Payer-Specific Rules & Overrides
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Configure custom validation rules and field mappings for specific
              payers
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
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
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Override Rule
          </Button>
        </div>

        <div className="space-y-4">
          {payerRules.map((rule) => (
            <div
              key={rule.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) =>
                      handleTogglePayerRule(rule.id, checked)
                    }
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {rule.payerName} - {rule.ruleName}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {rule.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditPayerRule(rule.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-3">
                <div
                  className={`text-xs ${
                    rule.enabled
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-500 dark:text-slate-500"
                  }`}
                >
                  <span className="font-medium">
                    {rule.enabled ? "Active Rules:" : "Rules (Disabled):"}
                  </span>
                </div>
                <div
                  className={`flex flex-wrap gap-2 ${
                    !rule.enabled ? "opacity-50" : ""
                  }`}
                >
                  {rule.rules.map((ruleName, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {ruleName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Rules Message */}
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg mt-4">
          <p className="text-sm font-medium">
            Need to add more payer-specific rules?
          </p>
          <p className="text-xs mt-1">
            Click &quot;Add Override Rule&quot; to create custom validation for
            specific payers
          </p>
        </div>
      </Card>

      {/* Field Mapping Overrides */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Field Mapping Overrides
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Customize how fields are mapped for different payers
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingFieldMappingIndex(null);
              setFieldMappingForm({
                payer: "",
                field: "",
                mapping: "",
                enabled: true,
              });
              setShowFieldMappingDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field Mapping
          </Button>
        </div>

        <div className="space-y-3">
          {fieldMappings.map((mapping, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={mapping.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleFieldMapping(index, checked)
                  }
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {mapping.payer} - {mapping.field}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {mapping.mapping}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditFieldMapping(index)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFieldMapping(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Special Handling Rules */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Special Handling Rules
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-slate-900 dark:text-slate-100">
                Auto-Retry Failed Claims
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically retry claims that fail payer-specific validation
              </p>
            </div>
            <Switch
              checked={specialHandlingRules.autoRetryFailedClaims}
              onCheckedChange={(checked) =>
                handleToggleSpecialRule("autoRetryFailedClaims", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-slate-900 dark:text-slate-100">
                Priority Processing for High-Value Claims
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Process claims over $500 with enhanced validation
              </p>
            </div>
            <Switch
              checked={specialHandlingRules.priorityProcessingHighValue}
              onCheckedChange={(checked) =>
                handleToggleSpecialRule("priorityProcessingHighValue", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-slate-900 dark:text-slate-100">
                Batch Processing for Medicare
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Group Medicare claims for efficient batch submission
              </p>
            </div>
            <Switch
              checked={specialHandlingRules.batchProcessingMedicare}
              onCheckedChange={(checked) =>
                handleToggleSpecialRule("batchProcessingMedicare", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Supported Payers Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported Payers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Medicare",
            "Medicaid",
            "Aetna",
            "Anthem",
            "Cigna",
            "UnitedHealthcare",
            "Humana",
            "BCBS",
          ].map((payer) => (
            <div
              key={payer}
              className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <p className="font-medium text-sm">{payer}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portal Integration
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Team Members
          </h3>
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        <div className="space-y-3">
          {teamMembers.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{user.role}</Badge>
                <Badge
                  variant={user.status === "Active" ? "default" : "secondary"}
                >
                  {user.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditUser(index)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderEHRSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            EHR Integration
          </h3>
          <Button variant="outline" asChild>
            <Link href="/settings/ehr">
              <Globe className="w-4 h-4 mr-2" />
              Manage EHR Connections
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure your Electronic Health Record system connections to enable
          data synchronization and automation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Environment</h4>
              <Badge variant="outline">0 connections</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No EHR connections configured
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Environment</h4>
              <Badge variant="outline">0 connections</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No EHR connections configured
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported EHR Systems
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Epic",
            "Cerner",
            "athenahealth",
            "Allscripts",
            "NextGen",
            "eClinicalWorks",
          ].map((system) => (
            <div
              key={system}
              className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <p className="font-medium text-sm">{system}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                FHIR/REST API
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderWebhookSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Webhook Management
          </h3>
          <Button variant="outline" asChild>
            <Link href="/settings/webhooks">
              <Webhook className="w-4 h-4 mr-2" />
              Manage Webhooks
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure webhook endpoints to receive real-time notifications when
          your team data changes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Webhooks</h4>
              <Badge variant="outline">0 active</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No production webhooks configured
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Webhooks</h4>
              <Badge variant="outline">0 active</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No development webhooks configured
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Available Events
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "team.created",
            "team.updated",
            "team.deleted",
            "team_member.added",
            "team_member.updated",
            "team_member.removed",
          ].map((event) => (
            <div
              key={event}
              className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded"
            >
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {event}
              </code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderFieldMappingSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Field Mappings
          </h3>
          <Button variant="outline" asChild>
            <Link href="/settings/field-mappings">
              <Settings className="w-4 h-4 mr-2" />
              Manage Field Mappings
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure custom field mapping rules for data integration between EHR
          systems and your team&apos;s workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Active Mappings</h4>
              <Badge variant="outline">0 mappings</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No field mappings configured
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Validation Rules</h4>
              <Badge variant="outline">0 rules</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No validation rules configured
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Entity Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Patient",
            "Provider",
            "Claim",
            "Prior Auth",
            "Medication",
            "Diagnosis",
            "Procedure",
            "Insurance",
          ].map((entity) => (
            <div
              key={entity}
              className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <p className="font-medium text-sm">{entity}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Field Mapping
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Data Transformations
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Text formatting (upper/lower case, trim)</li>
              <li>• Phone number formatting</li>
              <li>• Date/time conversion</li>
              <li>• Name parsing and extraction</li>
              <li>• Custom transformation functions</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Validation Rules
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Required field validation</li>
              <li>• Format validation (email, phone)</li>
              <li>• Length and pattern matching</li>
              <li>• Custom validation rules</li>
              <li>• Blocking vs. warning rules</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

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
                      {key === "cmm" ? "CMM API" : key}
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
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Access Controls
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Default User Role</Label>
            <Select defaultValue="PA Coordinator">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PA Coordinator">PA Coordinator</SelectItem>
                <SelectItem value="PA Reviewer">PA Reviewer</SelectItem>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Read Only">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Require MFA</Label>
              <p className="text-sm text-muted-foreground">
                Require multi-factor authentication for all users
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out inactive users
              </p>
            </div>
            <Select defaultValue="1 hour">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 minutes">30 minutes</SelectItem>
                <SelectItem value="1 hour">1 hour</SelectItem>
                <SelectItem value="4 hours">4 hours</SelectItem>
                <SelectItem value="8 hours">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Audit & Compliance
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Track all user actions and system events
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">HIPAA Compliance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable additional privacy and security controls
              </p>
            </div>
            <Switch checked disabled />
          </div>

          {/* Detailed Audit Trail Configuration */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Detailed Audit Trail Configuration
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log All Rule Applications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track when validation rules are applied and their outcomes
                </p>
              </div>
              <Switch
                checked={
                  validationSettings.auditLogging?.logRuleApplications || false
                }
                onCheckedChange={(checked) =>
                  handleSettingChange("validation", "auditLogging", {
                    ...validationSettings.auditLogging,
                    logRuleApplications: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log Auto-Fix Actions
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record all automatic corrections made to claims and ePAs
                </p>
              </div>
              <Switch
                checked={validationSettings.auditLogging?.logAutoFixes || false}
                onCheckedChange={(checked) =>
                  handleSettingChange("validation", "auditLogging", {
                    ...validationSettings.auditLogging,
                    logAutoFixes: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Audit Log Retention Period
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How long to keep detailed audit trail records for compliance
                </p>
              </div>
              <Select
                value={
                  validationSettings.auditLogging?.retentionPeriod ?? "1year"
                }
                onValueChange={(value) =>
                  handleSettingChange("validation", "auditLogging", {
                    ...validationSettings.auditLogging,
                    retentionPeriod: value,
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="3years">3 years</SelectItem>
                  <SelectItem value="7years">7 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Original Data Retention Setting */}
          <div className="space-y-2 border-t pt-4">
            <Label>General Data Retention Period</Label>
            <Select defaultValue="7 years">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 year">1 year</SelectItem>
                <SelectItem value="2 years">2 years</SelectItem>
                <SelectItem value="5 years">5 years</SelectItem>
                <SelectItem value="7 years">7 years</SelectItem>
                <SelectItem value="Indefinite">Indefinite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "automation":
        return renderAutomationSettings();
      case "visit-types":
        return renderVisitTypesSettings();
      case "modifiers":
        return renderModifiersSettings();
      case "required-fields":
        return renderRequiredFieldsSettings();
      case "time-based":
        return renderTimeBasedSettings();
      case "credentialing":
        return renderCredentialingSettings();
      case "denial-playbook":
        return renderDenialPlaybookSettings();
      case "diagnosis-validation":
        return renderDiagnosisValidationSettings();
      case "payers":
        return renderPayerConfigurationSettings();
      case "notifications":
        return renderNotificationSettings();
      case "ehr":
        return renderEHRSettings();
      case "webhooks":
        return renderWebhookSettings();
      case "field-mappings":
        return renderFieldMappingSettings();
      case "integrations":
        return renderIntegrationSettings();
      case "security":
        return renderSecuritySettings();
      case "users":
        return renderUserManagement();
      default:
        return renderAutomationSettings();
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
          <p className="text-gray-600 dark:text-gray-400">
            Manage your PA automation system configuration
          </p>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} className="flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <Card className="p-4">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">{renderSectionContent()}</div>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="invite-welcomeEmail"
                checked={inviteForm.sendWelcomeEmail}
                onCheckedChange={(checked) =>
                  handleInviteFormChange("sendWelcomeEmail", checked)
                }
              />
              <Label htmlFor="invite-welcomeEmail" className="text-sm">
                Send welcome email with setup instructions
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={
                !inviteForm.email ||
                !inviteForm.firstName ||
                !inviteForm.lastName
              }
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
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
                value={editForm.email}
                onChange={(e) => handleEditFormChange("email", e.target.value)}
                placeholder="jane.doe@company.com"
                required
              />
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
          <DialogHeader className="flex-shrink-0">
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

          <DialogFooter className="flex-shrink-0">
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
          <DialogHeader className="flex-shrink-0">
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

          <DialogFooter className="flex-shrink-0">
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
  initialAutomationSettings,
  initialNotificationSettings,
  initialValidationSettings,
}: SettingsProps) {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent
        initialAutomationSettings={initialAutomationSettings}
        initialNotificationSettings={initialNotificationSettings}
        initialValidationSettings={initialValidationSettings}
      />
    </Suspense>
  );
}
