import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface PriorAuthSlice {
  // State
  priorAuths: Tables<"prior_auth">[];
  selectedPriorAuth: Tables<"prior_auth"> | null;
  paClinicalCriteria: Record<string, Tables<"pa_clinical_criteria">[]>;
  paRequirementRules: Record<string, Tables<"pa_requirement_rule">[]>;
  paSupportingDocuments: Record<string, Tables<"pa_supporting_document">[]>;

  // Loading states
  priorAuthsLoading: boolean;
  paClinicalCriteriaLoading: boolean;
  paRequirementRulesLoading: boolean;
  paSupportingDocumentsLoading: boolean;

  // Error states
  priorAuthsError: string | null;
  paClinicalCriteriaError: string | null;
  paRequirementRulesError: string | null;

  // Filter state
  paFilters: {
    status?: Tables<"prior_auth">["status"][];
    payerId?: number;
    patientId?: number;
    medication?: string;
    urgency?: "routine" | "urgent" | "stat";
    expiringWithin?: number; // days
    assignedTo?: string;
  };

  // Actions
  setPriorAuths: (priorAuths: Tables<"prior_auth">[]) => void;
  setSelectedPriorAuth: (priorAuth: Tables<"prior_auth"> | null) => void;
  addPriorAuth: (priorAuth: Tables<"prior_auth">) => void;
  updatePriorAuth: (id: string, updates: Partial<Tables<"prior_auth">>) => void;
  removePriorAuth: (id: string) => void;

  // PA clinical criteria actions
  setPAClinicalCriteria: (
    paId: string,
    criteria: Tables<"pa_clinical_criteria">[]
  ) => void;
  addPAClinicalCriteria: (criteria: Tables<"pa_clinical_criteria">) => void;
  updatePAClinicalCriteria: (
    id: string,
    updates: Partial<Tables<"pa_clinical_criteria">>
  ) => void;
  removePAClinicalCriteria: (id: string) => void;

  // PA requirement rules actions
  setPARequirementRules: (
    paId: string,
    rules: Tables<"pa_requirement_rule">[]
  ) => void;
  addPARequirementRule: (rule: Tables<"pa_requirement_rule">) => void;
  updatePARequirementRule: (
    id: string,
    updates: Partial<Tables<"pa_requirement_rule">>
  ) => void;
  removePARequirementRule: (id: string) => void;

  // PA supporting documents actions
  setPASupportingDocuments: (
    paId: string,
    documents: Tables<"pa_supporting_document">[]
  ) => void;
  addPASupportingDocument: (document: Tables<"pa_supporting_document">) => void;
  updatePASupportingDocument: (
    id: string,
    updates: Partial<Tables<"pa_supporting_document">>
  ) => void;
  removePASupportingDocument: (id: string) => void;

  // Filter actions
  setPAFilters: (filters: PriorAuthSlice["paFilters"]) => void;
  clearPAFilters: () => void;

  // Async actions
  fetchPriorAuths: () => Promise<void>;
  fetchPriorAuthById: (id: string) => Promise<void>;
  fetchPAClinicalCriteria: (paId: string) => Promise<void>;
  fetchPARequirementRules: (paId: string) => Promise<void>;
  fetchPASupportingDocuments: (paId: string) => Promise<void>;
  submitPriorAuth: (paId: string) => Promise<void>;
  approvePriorAuth: (paId: string, approvalData: any) => Promise<void>;
  denyPriorAuth: (paId: string, denialReason: string) => Promise<void>;
}

export const createPriorAuthSlice: StateCreator<
  PriorAuthSlice,
  [],
  [],
  PriorAuthSlice
> = (set, get) => ({
  // Initial state
  priorAuths: [],
  selectedPriorAuth: null,
  paClinicalCriteria: {},
  paRequirementRules: {},
  paSupportingDocuments: {},

  // Loading states
  priorAuthsLoading: false,
  paClinicalCriteriaLoading: false,
  paRequirementRulesLoading: false,
  paSupportingDocumentsLoading: false,

  // Error states
  priorAuthsError: null,
  paClinicalCriteriaError: null,
  paRequirementRulesError: null,

  // Filter state
  paFilters: {
    status: ["pending_info", "ready_to_submit"],
    urgency: "routine",
  },

  // Basic actions
  setPriorAuths: (priorAuths) => set({ priorAuths }),
  setSelectedPriorAuth: (priorAuth) => set({ selectedPriorAuth: priorAuth }),

  addPriorAuth: (priorAuth) =>
    set((state) => ({
      priorAuths: [...state.priorAuths, priorAuth],
    })),

  updatePriorAuth: (id, updates) =>
    set((state) => ({
      priorAuths: state.priorAuths.map((pa) =>
        pa.id === id ? { ...pa, ...updates } : pa
      ),
      selectedPriorAuth:
        state.selectedPriorAuth?.id === id
          ? { ...state.selectedPriorAuth, ...updates }
          : state.selectedPriorAuth,
    })),

  removePriorAuth: (id) =>
    set((state) => ({
      priorAuths: state.priorAuths.filter((pa) => pa.id !== id),
      selectedPriorAuth:
        state.selectedPriorAuth?.id === id ? null : state.selectedPriorAuth,
    })),

  // PA clinical criteria actions
  setPAClinicalCriteria: (paId, criteria) =>
    set((state) => ({
      paClinicalCriteria: { ...state.paClinicalCriteria, [paId]: criteria },
    })),

  addPAClinicalCriteria: (criteria) =>
    set((state) => {
      const paId = criteria.id;
      const currentCriteria = state.paClinicalCriteria[paId] || [];
      return {
        paClinicalCriteria: {
          ...state.paClinicalCriteria,
          [paId]: [...currentCriteria, criteria],
        },
      };
    }),

  updatePAClinicalCriteria: (id, updates) =>
    set((state) => {
      const newCriteria = { ...state.paClinicalCriteria };
      Object.keys(newCriteria).forEach((paId) => {
        newCriteria[paId] = newCriteria[paId].map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
      });
      return { paClinicalCriteria: newCriteria };
    }),

  removePAClinicalCriteria: (id) =>
    set((state) => {
      const newCriteria = { ...state.paClinicalCriteria };
      Object.keys(newCriteria).forEach((paId) => {
        newCriteria[paId] = newCriteria[paId].filter((c) => c.id !== id);
      });
      return { paClinicalCriteria: newCriteria };
    }),

  // PA requirement rules actions
  setPARequirementRules: (paId, rules) =>
    set((state) => ({
      paRequirementRules: { ...state.paRequirementRules, [paId]: rules },
    })),

  addPARequirementRule: (rule) =>
    set((state) => {
      const paId = rule.id;
      const currentRules = state.paRequirementRules[paId] || [];
      return {
        paRequirementRules: {
          ...state.paRequirementRules,
          [paId]: [...currentRules, rule],
        },
      };
    }),

  updatePARequirementRule: (id, updates) =>
    set((state) => {
      const newRules = { ...state.paRequirementRules };
      Object.keys(newRules).forEach((paId) => {
        newRules[paId] = newRules[paId].map((r) =>
          r.id === id ? { ...r, ...updates } : r
        );
      });
      return { paRequirementRules: newRules };
    }),

  removePARequirementRule: (id) =>
    set((state) => {
      const newRules = { ...state.paRequirementRules };
      Object.keys(newRules).forEach((paId) => {
        newRules[paId] = newRules[paId].filter((r) => r.id !== id);
      });
      return { paRequirementRules: newRules };
    }),

  // PA supporting documents actions
  setPASupportingDocuments: (paId, documents) =>
    set((state) => ({
      paSupportingDocuments: {
        ...state.paSupportingDocuments,
        [paId]: documents,
      },
    })),

  addPASupportingDocument: (document) =>
    set((state) => {
      const paId = document.prior_auth_id;
      const currentDocuments = state.paSupportingDocuments[paId] || [];
      return {
        paSupportingDocuments: {
          ...state.paSupportingDocuments,
          [paId]: [...currentDocuments, document],
        },
      };
    }),

  updatePASupportingDocument: (id, updates) =>
    set((state) => {
      const newDocuments = { ...state.paSupportingDocuments };
      Object.keys(newDocuments).forEach((paId) => {
        newDocuments[paId] = newDocuments[paId].map((d) =>
          d.id === id ? { ...d, ...updates } : d
        );
      });
      return { paSupportingDocuments: newDocuments };
    }),

  removePASupportingDocument: (id) =>
    set((state) => {
      const newDocuments = { ...state.paSupportingDocuments };
      Object.keys(newDocuments).forEach((paId) => {
        newDocuments[paId] = newDocuments[paId].filter((d) => d.id !== id);
      });
      return { paSupportingDocuments: newDocuments };
    }),

  // Filter actions
  setPAFilters: (filters) =>
    set((state) => ({
      paFilters: { ...state.paFilters, ...filters },
    })),

  clearPAFilters: () =>
    set({
      paFilters: {
        status: ["pending_info", "ready_to_submit"],
        urgency: "routine",
      },
    }),

  // Async actions
  fetchPriorAuths: async () => {
    set({ priorAuthsLoading: true, priorAuthsError: null });
    try {
      const { data, error } = await supabase
        .from("prior_auth")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ priorAuths: data || [], priorAuthsLoading: false });
    } catch (error) {
      set({
        priorAuthsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch prior auths",
        priorAuthsLoading: false,
      });
    }
  },

  fetchPriorAuthById: async (id) => {
    try {
      const { data, error } = await supabase
        .from("prior_auth")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        get().setSelectedPriorAuth(data);
        // Also update in priorAuths array if it exists
        const priorAuths = get().priorAuths;
        const existingIndex = priorAuths.findIndex((pa) => pa.id === id);
        if (existingIndex >= 0) {
          get().updatePriorAuth(id, data);
        } else {
          get().addPriorAuth(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch prior auth:", error);
    }
  },

  fetchPAClinicalCriteria: async (paId) => {
    set({ paClinicalCriteriaLoading: true, paClinicalCriteriaError: null });
    try {
      const { data, error } = await supabase
        .from("pa_clinical_criteria")
        .select("*")
        .eq("prior_auth_id", paId);

      if (error) throw error;
      get().setPAClinicalCriteria(paId, data || []);
      set({ paClinicalCriteriaLoading: false });
    } catch (error) {
      set({
        paClinicalCriteriaError:
          error instanceof Error
            ? error.message
            : "Failed to fetch PA clinical criteria",
        paClinicalCriteriaLoading: false,
      });
    }
  },

  fetchPARequirementRules: async (paId) => {
    set({ paRequirementRulesLoading: true, paRequirementRulesError: null });
    try {
      const { data, error } = await supabase
        .from("pa_requirement_rule")
        .select("*")
        .eq("prior_auth_id", paId);

      if (error) throw error;
      get().setPARequirementRules(paId, data || []);
      set({ paRequirementRulesLoading: false });
    } catch (error) {
      set({
        paRequirementRulesError:
          error instanceof Error
            ? error.message
            : "Failed to fetch PA requirement rules",
        paRequirementRulesLoading: false,
      });
    }
  },

  fetchPASupportingDocuments: async (paId) => {
    set({ paSupportingDocumentsLoading: true });
    try {
      const { data, error } = await supabase
        .from("pa_supporting_document")
        .select("*")
        .eq("prior_auth_id", paId);

      if (error) throw error;
      get().setPASupportingDocuments(paId, data || []);
      set({ paSupportingDocumentsLoading: false });
    } catch (error) {
      set({ paSupportingDocumentsLoading: false });
    }
  },

  submitPriorAuth: async (paId) => {
    try {
      const { error } = await supabase
        .from("prior_auth")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", paId);

      if (error) throw error;

      // Update local state
      get().updatePriorAuth(paId, {
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to submit prior auth:", error);
      throw error;
    }
  },

  approvePriorAuth: async (paId, approvalData) => {
    try {
      const { error } = await supabase
        .from("prior_auth")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          auth_number: approvalData.approvalNumber,
          duration_days: approvalData.durationDays,
        })
        .eq("id", paId);

      if (error) throw error;

      // Update local state
      get().updatePriorAuth(paId, {
        status: "approved",
        approved_at: new Date().toISOString(),
        auth_number: approvalData.approvalNumber,
        duration_days: approvalData.durationDays,
      });
    } catch (error) {
      console.error("Failed to approve prior auth:", error);
      throw error;
    }
  },

  denyPriorAuth: async (paId, denialReason) => {
    try {
      const { error } = await supabase
        .from("prior_auth")
        .update({
          status: "denied",
          denied_at: new Date().toISOString(),
          issues: [denialReason],
        })
        .eq("id", paId);

      if (error) throw error;

      // Update local state
      get().updatePriorAuth(paId, {
        status: "denied",
        denied_at: new Date().toISOString(),
        issues: [denialReason],
      });
    } catch (error) {
      console.error("Failed to deny prior auth:", error);
      throw error;
    }
  },
});
