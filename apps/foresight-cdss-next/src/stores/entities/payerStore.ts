import { StateCreator } from "zustand";

// AWS-compatible types
type Payer = {
  id: string;
  organizationId: string;
  name: string;
  payerType: string;
  planType?: string;
  payerNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  hasPortalAccess: boolean;
  submissionMethod: 'electronic' | 'paper' | 'portal';
  createdAt: Date;
  updatedAt: Date;
};

type PayerConfig = {
  id: string;
  payerId: string;
  submissionFormat: string;
  requiresPriorAuth: boolean;
  claimSubmissionUrl?: string;
  eligibilityUrl?: string;
  priorAuthUrl?: string;
  timeoutSeconds: number;
  retryAttempts: number;
  config: any;
  createdAt: Date;
  updatedAt: Date;
};

type PayerPortalCredential = {
  id: string;
  payerId: string;
  credentialType: string;
  username?: string;
  password?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PayerResponseMessage = {
  id: string;
  payerId: string;
  messageType: string;
  messageCode: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  createdAt: Date;
};

type PayerSubmissionConfig = {
  id: string;
  payerId: string;
  claimType: string;
  submissionFormat: string;
  requiredFields: string[];
  validationRules: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InsurancePolicy = {
  id: string;
  organizationId: string;
  patientId: string;
  payerId: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName: string;
  subscriberId: string;
  relationshipToSubscriber: string;
  effectiveDate: Date;
  terminationDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BenefitsCoverage = {
  id: string;
  insurancePolicyId: string;
  benefitType: string;
  coverageLevel: string;
  deductible?: number;
  copay?: number;
  coinsurance?: number;
  outOfPocketMax?: number;
  lifetimeMax?: number;
  isActive: boolean;
  effectiveDate: Date;
  terminationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type EligibilityCheck = {
  id: string;
  organizationId: string;
  patientId: string;
  insurancePolicyId: string;
  status: 'pending' | 'completed' | 'failed';
  requestData: any;
  responseData?: any;
  eligibilityDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

type EligibilityCache = {
  id: string;
  patientId: string;
  payerId: string;
  eligibilityData: any;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type DrugFormulary = {
  id: string;
  payerId: string;
  drugName: string;
  ndc: string;
  tier: string;
  isPreferred: boolean;
  requiresPriorAuth: boolean;
  isActive: boolean;
  effectiveDate: Date;
  terminationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type FeeSchedule = {
  id: string;
  payerId: string;
  procedureCode: string;
  description: string;
  allowedAmount: number;
  effectiveDate: Date;
  terminationDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface PayerSlice {
  // State
  payers: Payer[];
  selectedPayer: Payer | null;
  payerConfigs: Record<string, PayerConfig>;
  payerPortalCredentials: Record<string, PayerPortalCredential[]>;
  payerResponseMessages: Record<string, PayerResponseMessage[]>;
  payerSubmissionConfigs: Record<string, PayerSubmissionConfig[]>;
  insurancePolicies: InsurancePolicy[];
  benefitsCoverage: BenefitsCoverage[];
  eligibilityChecks: EligibilityCheck[];
  eligibilityCache: EligibilityCache[];
  drugFormulary: DrugFormulary[];
  feeSchedules: FeeSchedule[];

  // Loading states
  payersLoading: boolean;
  payerConfigsLoading: boolean;
  payerPortalCredentialsLoading: boolean;
  insurancePoliciesLoading: boolean;
  benefitsCoverageLoading: boolean;
  eligibilityChecksLoading: boolean;
  drugFormularyLoading: boolean;

  // Error states
  payersError: string | null;
  payerConfigsError: string | null;
  insurancePoliciesError: string | null;

  // Filter state
  payerFilters: {
    payerType?: string;
    activeOnly?: boolean;
    hasPortalAccess?: boolean;
  };

  // Actions
  setPayers: (payers: Payer[]) => void;
  setSelectedPayer: (payer: Payer | null) => void;
  addPayer: (payer: Payer) => void;
  updatePayer: (id: string, updates: Partial<Payer>) => void;
  removePayer: (id: string) => void;

  // Payer configs actions
  setPayerConfigs: (payerId: string, config: PayerConfig) => void;
  updatePayerConfig: (payerId: string, updates: Partial<PayerConfig>) => void;

  // Payer portal credentials actions
  setPayerPortalCredentials: (payerId: string, credentials: PayerPortalCredential[]) => void;
  addPayerPortalCredential: (credential: PayerPortalCredential) => void;
  updatePayerPortalCredential: (id: string, updates: Partial<PayerPortalCredential>) => void;
  removePayerPortalCredential: (id: string) => void;

  // Payer response messages actions
  setPayerResponseMessages: (payerId: string, messages: PayerResponseMessage[]) => void;
  addPayerResponseMessage: (message: PayerResponseMessage) => void;

  // Payer submission configs actions
  setPayerSubmissionConfigs: (payerId: string, configs: PayerSubmissionConfig[]) => void;
  addPayerSubmissionConfig: (config: PayerSubmissionConfig) => void;
  updatePayerSubmissionConfig: (id: string, updates: Partial<PayerSubmissionConfig>) => void;

  // Insurance policies actions
  setInsurancePolicies: (policies: InsurancePolicy[]) => void;
  addInsurancePolicy: (policy: InsurancePolicy) => void;
  updateInsurancePolicy: (id: string, updates: Partial<InsurancePolicy>) => void;
  removeInsurancePolicy: (id: string) => void;

  // Benefits coverage actions
  setBenefitsCoverage: (coverage: BenefitsCoverage[]) => void;
  addBenefitsCoverage: (coverage: BenefitsCoverage) => void;
  updateBenefitsCoverage: (id: string, updates: Partial<BenefitsCoverage>) => void;

  // Eligibility checks actions
  setEligibilityChecks: (checks: EligibilityCheck[]) => void;
  addEligibilityCheck: (check: EligibilityCheck) => void;
  updateEligibilityCheck: (id: string, updates: Partial<EligibilityCheck>) => void;

  // Eligibility cache actions
  setEligibilityCache: (cache: EligibilityCache[]) => void;
  addEligibilityCache: (cache: EligibilityCache) => void;
  updateEligibilityCache: (id: string, updates: Partial<EligibilityCache>) => void;

  // Drug formulary actions
  setDrugFormulary: (formulary: DrugFormulary[]) => void;
  addDrugFormulary: (formulary: DrugFormulary) => void;
  updateDrugFormulary: (id: string, updates: Partial<DrugFormulary>) => void;

  // Fee schedules actions
  setFeeSchedules: (schedules: FeeSchedule[]) => void;
  addFeeSchedule: (schedule: FeeSchedule) => void;
  updateFeeSchedule: (id: string, updates: Partial<FeeSchedule>) => void;

  // Filter actions
  setPayerFilters: (filters: PayerSlice["payerFilters"]) => void;
  clearPayerFilters: () => void;

  // Async actions
  fetchPayers: () => Promise<void>;
  fetchPayerById: (id: string) => Promise<void>;
  fetchPayerConfig: (payerId: string) => Promise<void>;
  fetchPayerPortalCredentials: (payerId: string) => Promise<void>;
  fetchPayerResponseMessages: (payerId: string) => Promise<void>;
  fetchPayerSubmissionConfigs: (payerId: string) => Promise<void>;
  fetchInsurancePolicies: () => Promise<void>;
  fetchBenefitsCoverage: () => Promise<void>;
  fetchEligibilityChecks: () => Promise<void>;
  fetchEligibilityCache: () => Promise<void>;
  fetchDrugFormulary: () => Promise<void>;
  fetchFeeSchedules: () => Promise<void>;
  checkEligibility: (patientId: string, payerId: string) => Promise<void>;
  verifyBenefits: (policyId: string) => Promise<void>;
}

export const createPayerSlice: StateCreator<PayerSlice, [], [], PayerSlice> = (
  set,
  get
) => ({
  // Initial state
  payers: [],
  selectedPayer: null,
  payerConfigs: {},
  payerPortalCredentials: {},
  payerResponseMessages: {},
  payerSubmissionConfigs: {},
  insurancePolicies: [],
  benefitsCoverage: [],
  eligibilityChecks: [],
  eligibilityCache: [],
  drugFormulary: [],
  feeSchedules: [],

  // Loading states
  payersLoading: false,
  payerConfigsLoading: false,
  payerPortalCredentialsLoading: false,
  insurancePoliciesLoading: false,
  benefitsCoverageLoading: false,
  eligibilityChecksLoading: false,
  drugFormularyLoading: false,

  // Error states
  payersError: null,
  payerConfigsError: null,
  insurancePoliciesError: null,

  // Filter state
  payerFilters: {
    activeOnly: true,
  },

  // Payers actions
  setPayers: (payers) => set({ payers }),
  setSelectedPayer: (payer) => set({ selectedPayer: payer }),

  addPayer: (payer) =>
    set((state) => ({
      payers: [...state.payers, payer],
    })),

  updatePayer: (id, updates) =>
    set((state) => ({
      payers: state.payers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      selectedPayer:
        state.selectedPayer?.id === id
          ? { ...state.selectedPayer, ...updates }
          : state.selectedPayer,
    })),

  removePayer: (id) =>
    set((state) => ({
      payers: state.payers.filter((p) => p.id !== id),
      selectedPayer:
        state.selectedPayer?.id === id ? null : state.selectedPayer,
    })),

  // Payer configs actions
  setPayerConfigs: (payerId, config) =>
    set((state) => ({
      payerConfigs: { ...state.payerConfigs, [payerId]: config },
    })),

  updatePayerConfig: (payerId, updates) =>
    set((state) => ({
      payerConfigs: {
        ...state.payerConfigs,
        [payerId]: { ...state.payerConfigs[payerId], ...updates },
      },
    })),

  // Payer portal credentials actions
  setPayerPortalCredentials: (payerId, credentials) =>
    set((state) => ({
      payerPortalCredentials: {
        ...state.payerPortalCredentials,
        [payerId]: credentials,
      },
    })),

  addPayerPortalCredential: (credential) =>
    set((state) => {
      const payerId = credential.payerId;
      const currentCredentials = state.payerPortalCredentials[payerId] || [];
      return {
        payerPortalCredentials: {
          ...state.payerPortalCredentials,
          [payerId]: [...currentCredentials, credential],
        },
      };
    }),

  updatePayerPortalCredential: (id, updates) =>
    set((state) => {
      const newCredentials = { ...state.payerPortalCredentials };
      for (const payerId of Object.keys(newCredentials)) {
        newCredentials[payerId] = newCredentials[payerId].map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
      }
      return { payerPortalCredentials: newCredentials };
    }),

  removePayerPortalCredential: (id) =>
    set((state) => {
      const newCredentials = { ...state.payerPortalCredentials };
      for (const payerId of Object.keys(newCredentials)) {
        newCredentials[payerId] = newCredentials[payerId].filter((c) => c.id !== id);
      }
      return { payerPortalCredentials: newCredentials };
    }),

  // Payer response messages actions
  setPayerResponseMessages: (payerId, messages) =>
    set((state) => ({
      payerResponseMessages: {
        ...state.payerResponseMessages,
        [payerId]: messages,
      },
    })),

  addPayerResponseMessage: (message) =>
    set((state) => {
      const payerId = message.payerId;
      const currentMessages = state.payerResponseMessages[payerId] || [];
      return {
        payerResponseMessages: {
          ...state.payerResponseMessages,
          [payerId]: [...currentMessages, message],
        },
      };
    }),

  // Payer submission configs actions
  setPayerSubmissionConfigs: (payerId, configs) =>
    set((state) => ({
      payerSubmissionConfigs: {
        ...state.payerSubmissionConfigs,
        [payerId]: configs,
      },
    })),

  addPayerSubmissionConfig: (config) =>
    set((state) => {
      const payerId = config.payerId;
      const currentConfigs = state.payerSubmissionConfigs[payerId] || [];
      return {
        payerSubmissionConfigs: {
          ...state.payerSubmissionConfigs,
          [payerId]: [...currentConfigs, config],
        },
      };
    }),

  updatePayerSubmissionConfig: (id, updates) =>
    set((state) => {
      const newConfigs = { ...state.payerSubmissionConfigs };
      for (const payerId of Object.keys(newConfigs)) {
        newConfigs[payerId] = newConfigs[payerId].map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
      }
      return { payerSubmissionConfigs: newConfigs };
    }),

  // Insurance policies actions
  setInsurancePolicies: (policies) => set({ insurancePolicies: policies }),

  addInsurancePolicy: (policy) =>
    set((state) => ({
      insurancePolicies: [...state.insurancePolicies, policy],
    })),

  updateInsurancePolicy: (id, updates) =>
    set((state) => ({
      insurancePolicies: state.insurancePolicies.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removeInsurancePolicy: (id) =>
    set((state) => ({
      insurancePolicies: state.insurancePolicies.filter((p) => p.id !== id),
    })),

  // Benefits coverage actions
  setBenefitsCoverage: (coverage) => set({ benefitsCoverage: coverage }),

  addBenefitsCoverage: (coverage) =>
    set((state) => ({
      benefitsCoverage: [...state.benefitsCoverage, coverage],
    })),

  updateBenefitsCoverage: (id, updates) =>
    set((state) => ({
      benefitsCoverage: state.benefitsCoverage.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // Eligibility checks actions
  setEligibilityChecks: (checks) => set({ eligibilityChecks: checks }),

  addEligibilityCheck: (check) =>
    set((state) => ({
      eligibilityChecks: [...state.eligibilityChecks, check],
    })),

  updateEligibilityCheck: (id, updates) =>
    set((state) => ({
      eligibilityChecks: state.eligibilityChecks.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // Eligibility cache actions
  setEligibilityCache: (cache) => set({ eligibilityCache: cache }),

  addEligibilityCache: (cache) =>
    set((state) => ({
      eligibilityCache: [...state.eligibilityCache, cache],
    })),

  updateEligibilityCache: (id, updates) =>
    set((state) => ({
      eligibilityCache: state.eligibilityCache.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // Drug formulary actions
  setDrugFormulary: (formulary) => set({ drugFormulary: formulary }),

  addDrugFormulary: (formulary) =>
    set((state) => ({
      drugFormulary: [...state.drugFormulary, formulary],
    })),

  updateDrugFormulary: (id, updates) =>
    set((state) => ({
      drugFormulary: state.drugFormulary.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  // Fee schedules actions
  setFeeSchedules: (schedules) => set({ feeSchedules: schedules }),

  addFeeSchedule: (schedule) =>
    set((state) => ({
      feeSchedules: [...state.feeSchedules, schedule],
    })),

  updateFeeSchedule: (id, updates) =>
    set((state) => ({
      feeSchedules: state.feeSchedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  // Filter actions
  setPayerFilters: (filters) =>
    set((state) => ({
      payerFilters: { ...state.payerFilters, ...filters },
    })),

  clearPayerFilters: () =>
    set({
      payerFilters: {
        activeOnly: true,
      },
    }),

  // Async actions
  fetchPayers: async () => {
    set({ payersLoading: true, payersError: null });
    try {
      const response = await fetch('/api/payers');
      if (!response.ok) throw new Error('Failed to fetch payers');
      
      const data = await response.json();
      set({ payers: data.payers || [], payersLoading: false });
    } catch (error) {
      set({
        payersError:
          error instanceof Error ? error.message : "Failed to fetch payers",
        payersLoading: false,
      });
    }
  },

  fetchPayerById: async (id) => {
    try {
      const response = await fetch(`/api/payers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch payer');
      
      const data = await response.json();
      if (data.payer) {
        get().setSelectedPayer(data.payer);
        // Also update in payers array if it exists
        const payers = get().payers;
        const existingIndex = payers.findIndex((p) => p.id === id);
        if (existingIndex >= 0) {
          get().updatePayer(id, data.payer);
        } else {
          get().addPayer(data.payer);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payer:", error);
    }
  },

  fetchPayerConfig: async (payerId) => {
    set({ payerConfigsLoading: true, payerConfigsError: null });
    try {
      const response = await fetch(`/api/payers/${payerId}/config`);
      if (!response.ok) throw new Error('Failed to fetch payer config');
      
      const data = await response.json();
      if (data.config) {
        get().setPayerConfigs(payerId, data.config);
      }
      set({ payerConfigsLoading: false });
    } catch (error) {
      set({
        payerConfigsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch payer config",
        payerConfigsLoading: false,
      });
    }
  },

  fetchPayerPortalCredentials: async (payerId) => {
    set({ payerPortalCredentialsLoading: true });
    try {
      const response = await fetch(`/api/payers/${payerId}/portal-credentials`);
      if (!response.ok) throw new Error('Failed to fetch payer portal credentials');
      
      const data = await response.json();
      get().setPayerPortalCredentials(payerId, data.credentials || []);
      set({ payerPortalCredentialsLoading: false });
    } catch (error) {
      set({ payerPortalCredentialsLoading: false });
      console.error("Failed to fetch payer portal credentials:", error);
    }
  },

  fetchPayerResponseMessages: async (payerId) => {
    try {
      const response = await fetch(`/api/payers/${payerId}/response-messages`);
      if (!response.ok) throw new Error('Failed to fetch payer response messages');
      
      const data = await response.json();
      get().setPayerResponseMessages(payerId, data.messages || []);
    } catch (error) {
      console.error("Failed to fetch payer response messages:", error);
    }
  },

  fetchPayerSubmissionConfigs: async (payerId) => {
    try {
      const response = await fetch(`/api/payers/${payerId}/submission-configs`);
      if (!response.ok) throw new Error('Failed to fetch payer submission configs');
      
      const data = await response.json();
      get().setPayerSubmissionConfigs(payerId, data.configs || []);
    } catch (error) {
      console.error("Failed to fetch payer submission configs:", error);
    }
  },

  fetchInsurancePolicies: async () => {
    set({ insurancePoliciesLoading: true, insurancePoliciesError: null });
    try {
      const response = await fetch('/api/insurance-policies');
      if (!response.ok) throw new Error('Failed to fetch insurance policies');
      
      const data = await response.json();
      set({ insurancePolicies: data.policies || [], insurancePoliciesLoading: false });
    } catch (error) {
      set({
        insurancePoliciesError:
          error instanceof Error
            ? error.message
            : "Failed to fetch insurance policies",
        insurancePoliciesLoading: false,
      });
    }
  },

  fetchBenefitsCoverage: async () => {
    set({ benefitsCoverageLoading: true });
    try {
      const response = await fetch('/api/benefits-coverage');
      if (!response.ok) throw new Error('Failed to fetch benefits coverage');
      
      const data = await response.json();
      set({ benefitsCoverage: data.coverage || [], benefitsCoverageLoading: false });
    } catch (error) {
      set({ benefitsCoverageLoading: false });
      console.error("Failed to fetch benefits coverage:", error);
    }
  },

  fetchEligibilityChecks: async () => {
    set({ eligibilityChecksLoading: true });
    try {
      const response = await fetch('/api/eligibility-checks');
      if (!response.ok) throw new Error('Failed to fetch eligibility checks');
      
      const data = await response.json();
      set({ eligibilityChecks: data.checks || [], eligibilityChecksLoading: false });
    } catch (error) {
      set({ eligibilityChecksLoading: false });
      console.error("Failed to fetch eligibility checks:", error);
    }
  },

  fetchEligibilityCache: async () => {
    try {
      const response = await fetch('/api/eligibility-cache');
      if (!response.ok) throw new Error('Failed to fetch eligibility cache');
      
      const data = await response.json();
      set({ eligibilityCache: data.cache || [] });
    } catch (error) {
      console.error("Failed to fetch eligibility cache:", error);
    }
  },

  fetchDrugFormulary: async () => {
    set({ drugFormularyLoading: true });
    try {
      const response = await fetch('/api/drug-formulary');
      if (!response.ok) throw new Error('Failed to fetch drug formulary');
      
      const data = await response.json();
      set({ drugFormulary: data.formulary || [], drugFormularyLoading: false });
    } catch (error) {
      set({ drugFormularyLoading: false });
      console.error("Failed to fetch drug formulary:", error);
    }
  },

  fetchFeeSchedules: async () => {
    try {
      const response = await fetch('/api/fee-schedules');
      if (!response.ok) throw new Error('Failed to fetch fee schedules');
      
      const data = await response.json();
      set({ feeSchedules: data.schedules || [] });
    } catch (error) {
      console.error("Failed to fetch fee schedules:", error);
    }
  },

  checkEligibility: async (patientId, payerId) => {
    try {
      const response = await fetch('/api/eligibility-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          payerId,
        }),
      });

      if (!response.ok) throw new Error('Failed to check eligibility');
      
      const data = await response.json();
      if (data.check) {
        get().addEligibilityCheck(data.check);
      }
    } catch (error) {
      console.error("Failed to check eligibility:", error);
      throw error;
    }
  },

  verifyBenefits: async (policyId) => {
    try {
      const response = await fetch(`/api/insurance-policies/${policyId}/benefits`);
      if (!response.ok) throw new Error('Failed to verify benefits');
      
      const data = await response.json();
      // Update local state with benefits coverage data
      if (data.coverage) {
        get().setBenefitsCoverage(data.coverage);
      }
    } catch (error) {
      console.error("Failed to verify benefits:", error);
      throw error;
    }
  },
});