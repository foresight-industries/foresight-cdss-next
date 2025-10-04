import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface PayerSlice {
  // State
  payers: Tables<"payer">[];
  selectedPayer: Tables<"payer"> | null;
  payerConfigs: Record<number, Tables<"payer_config">>;
  payerPortalCredentials: Record<number, Tables<"payer_portal_credential">[]>;
  payerResponseMessages: Record<number, Tables<"payer_response_message">[]>;
  payerSubmissionConfigs: Record<number, Tables<"payer_submission_config">[]>;
  insurancePolicies: Tables<"insurance_policy">[];
  benefitsCoverage: Tables<"benefits_coverage">[];
  eligibilityChecks: Tables<"eligibility_check">[];
  eligibilityCache: Tables<"eligibility_cache">[];
  drugFormulary: Tables<"drug_formulary">[];
  feeSchedules: Tables<"fee_schedule">[];

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
  setPayers: (payers: Tables<"payer">[]) => void;
  setSelectedPayer: (payer: Tables<"payer"> | null) => void;
  addPayer: (payer: Tables<"payer">) => void;
  updatePayer: (id: number, updates: Partial<Tables<"payer">>) => void;
  removePayer: (id: number) => void;

  // Payer configs actions
  setPayerConfigs: (payerId: number, config: Tables<"payer_config">) => void;
  updatePayerConfig: (
    payerId: number,
    updates: Partial<Tables<"payer_config">>
  ) => void;

  // Payer portal credentials actions
  setPayerPortalCredentials: (
    payerId: number,
    credentials: Tables<"payer_portal_credential">[]
  ) => void;
  addPayerPortalCredential: (
    credential: Tables<"payer_portal_credential">
  ) => void;
  updatePayerPortalCredential: (
    id: string,
    updates: Partial<Tables<"payer_portal_credential">>
  ) => void;
  removePayerPortalCredential: (id: string) => void;

  // Payer response messages actions
  setPayerResponseMessages: (
    payerId: number,
    messages: Tables<"payer_response_message">[]
  ) => void;
  addPayerResponseMessage: (message: Tables<"payer_response_message">) => void;

  // Payer submission configs actions
  setPayerSubmissionConfigs: (
    payerId: number,
    configs: Tables<"payer_submission_config">[]
  ) => void;
  addPayerSubmissionConfig: (config: Tables<"payer_submission_config">) => void;
  updatePayerSubmissionConfig: (
    id: string,
    updates: Partial<Tables<"payer_submission_config">>
  ) => void;

  // Insurance policies actions
  setInsurancePolicies: (policies: Tables<"insurance_policy">[]) => void;
  addInsurancePolicy: (policy: Tables<"insurance_policy">) => void;
  updateInsurancePolicy: (
    id: string,
    updates: Partial<Tables<"insurance_policy">>
  ) => void;
  removeInsurancePolicy: (id: string) => void;

  // Benefits coverage actions
  setBenefitsCoverage: (coverage: Tables<"benefits_coverage">[]) => void;
  addBenefitsCoverage: (coverage: Tables<"benefits_coverage">) => void;
  updateBenefitsCoverage: (
    id: string,
    updates: Partial<Tables<"benefits_coverage">>
  ) => void;

  // Eligibility checks actions
  setEligibilityChecks: (checks: Tables<"eligibility_check">[]) => void;
  addEligibilityCheck: (check: Tables<"eligibility_check">) => void;
  updateEligibilityCheck: (
    id: string,
    updates: Partial<Tables<"eligibility_check">>
  ) => void;

  // Eligibility cache actions
  setEligibilityCache: (cache: Tables<"eligibility_cache">[]) => void;
  addEligibilityCache: (cache: Tables<"eligibility_cache">) => void;
  updateEligibilityCache: (
    id: string,
    updates: Partial<Tables<"eligibility_cache">>
  ) => void;

  // Drug formulary actions
  setDrugFormulary: (formulary: Tables<"drug_formulary">[]) => void;
  addDrugFormulary: (formulary: Tables<"drug_formulary">) => void;
  updateDrugFormulary: (
    id: string,
    updates: Partial<Tables<"drug_formulary">>
  ) => void;

  // Fee schedules actions
  setFeeSchedules: (schedules: Tables<"fee_schedule">[]) => void;
  addFeeSchedule: (schedule: Tables<"fee_schedule">) => void;
  updateFeeSchedule: (
    id: string,
    updates: Partial<Tables<"fee_schedule">>
  ) => void;

  // Filter actions
  setPayerFilters: (filters: PayerSlice["payerFilters"]) => void;
  clearPayerFilters: () => void;

  // Async actions
  fetchPayers: () => Promise<void>;
  fetchPayerById: (id: number) => Promise<void>;
  fetchPayerConfig: (payerId: number) => Promise<void>;
  fetchPayerPortalCredentials: (payerId: number) => Promise<void>;
  fetchPayerResponseMessages: (payerId: number) => Promise<void>;
  fetchPayerSubmissionConfigs: (payerId: number) => Promise<void>;
  fetchInsurancePolicies: () => Promise<void>;
  fetchBenefitsCoverage: () => Promise<void>;
  fetchEligibilityChecks: () => Promise<void>;
  fetchEligibilityCache: () => Promise<void>;
  fetchDrugFormulary: () => Promise<void>;
  fetchFeeSchedules: () => Promise<void>;
  checkEligibility: (patientId: number, payerId: number) => Promise<void>;
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
      const payerId = credential.payer_id;
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
      Object.keys(newCredentials).forEach((payerId) => {
        newCredentials[parseInt(payerId)] = newCredentials[
          parseInt(payerId)
        ].map((c) => (c.id === id ? { ...c, ...updates } : c));
      });
      return { payerPortalCredentials: newCredentials };
    }),

  removePayerPortalCredential: (id) =>
    set((state) => {
      const newCredentials = { ...state.payerPortalCredentials };
      Object.keys(newCredentials).forEach((payerId) => {
        newCredentials[parseInt(payerId)] = newCredentials[
          parseInt(payerId)
        ].filter((c) => c.id !== id);
      });
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
      const payerId = message.payer_id;
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
      const payerId = config.payer_id;
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
      Object.keys(newConfigs).forEach((payerId) => {
        newConfigs[parseInt(payerId)] = newConfigs[parseInt(payerId)].map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
      });
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
      const { data, error } = await supabase
        .from("payer")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      set({ payers: data || [], payersLoading: false });
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
      const { data, error } = await supabase
        .from("payer")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        get().setSelectedPayer(data);
        // Also update in payers array if it exists
        const payers = get().payers;
        const existingIndex = payers.findIndex((p) => p.id === id);
        if (existingIndex >= 0) {
          get().updatePayer(id, data);
        } else {
          get().addPayer(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payer:", error);
    }
  },

  fetchPayerConfig: async (payerId) => {
    set({ payerConfigsLoading: true, payerConfigsError: null });
    try {
      const { data, error } = await supabase
        .from("payer_config")
        .select("*")
        .eq("payer_id", payerId)
        .single();

      if (error) throw error;
      if (data) {
        get().setPayerConfigs(payerId, data);
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
      const { data, error } = await supabase
        .from("payer_portal_credential")
        .select("*")
        .eq("payer_id", payerId);

      if (error) throw error;
      get().setPayerPortalCredentials(payerId, data || []);
      set({ payerPortalCredentialsLoading: false });
    } catch (error) {
      set({ payerPortalCredentialsLoading: false });
    }
  },

  fetchPayerResponseMessages: async (payerId) => {
    try {
      const { data, error } = await supabase
        .from("payer_response_message")
        .select("*")
        .eq("payer_id", payerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      get().setPayerResponseMessages(payerId, data || []);
    } catch (error) {
      console.error("Failed to fetch payer response messages:", error);
    }
  },

  fetchPayerSubmissionConfigs: async (payerId) => {
    try {
      const { data, error } = await supabase
        .from("payer_submission_config")
        .select("*")
        .eq("payer_id", payerId);

      if (error) throw error;
      get().setPayerSubmissionConfigs(payerId, data || []);
    } catch (error) {
      console.error("Failed to fetch payer submission configs:", error);
    }
  },

  fetchInsurancePolicies: async () => {
    set({ insurancePoliciesLoading: true, insurancePoliciesError: null });
    try {
      const { data, error } = await supabase
        .from("insurance_policy")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ insurancePolicies: data || [], insurancePoliciesLoading: false });
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
      const { data, error } = await supabase
        .from("benefits_coverage")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ benefitsCoverage: data || [], benefitsCoverageLoading: false });
    } catch (error) {
      set({ benefitsCoverageLoading: false });
    }
  },

  fetchEligibilityChecks: async () => {
    set({ eligibilityChecksLoading: true });
    try {
      const { data, error } = await supabase
        .from("eligibility_check")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ eligibilityChecks: data || [], eligibilityChecksLoading: false });
    } catch (error) {
      set({ eligibilityChecksLoading: false });
    }
  },

  fetchEligibilityCache: async () => {
    try {
      const { data, error } = await supabase
        .from("eligibility_cache")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ eligibilityCache: data || [] });
    } catch (error) {
      console.error("Failed to fetch eligibility cache:", error);
    }
  },

  fetchDrugFormulary: async () => {
    set({ drugFormularyLoading: true });
    try {
      const { data, error } = await supabase
        .from("drug_formulary")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ drugFormulary: data || [], drugFormularyLoading: false });
    } catch (error) {
      set({ drugFormularyLoading: false });
    }
  },

  fetchFeeSchedules: async () => {
    try {
      const { data, error } = await supabase
        .from("fee_schedule")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ feeSchedules: data || [] });
    } catch (error) {
      console.error("Failed to fetch fee schedules:", error);
    }
  },

  checkEligibility: async (patientId, payerId) => {
    try {
      const { data, error } = await supabase
        .from("eligibility_check")
        .insert([
          {
            patient_id: patientId,
            payer_id: payerId,
            check_date: new Date().toISOString(),
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        get().addEligibilityCheck(data);
      }
    } catch (error) {
      console.error("Failed to check eligibility:", error);
      throw error;
    }
  },

  verifyBenefits: async (policyId) => {
    try {
      const { data, error } = await supabase
        .from("benefits_coverage")
        .select("*")
        .eq("insurance_policy_id", policyId);

      if (error) throw error;
      // Process benefits verification logic here
      return data;
    } catch (error) {
      console.error("Failed to verify benefits:", error);
      throw error;
    }
  },
});
