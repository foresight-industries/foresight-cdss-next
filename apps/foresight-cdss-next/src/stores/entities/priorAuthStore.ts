import { StateCreator } from "zustand";

// AWS-compatible types
type PriorAuth = {
  id: string;
  organizationId: string;
  patientId: string;
  payerId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled';
  requestType: string;
  urgency: 'routine' | 'urgent' | 'stat';
  medicationName?: string;
  dosage?: string;
  quantity?: number;
  daysSupply?: number;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  authNumber?: string;
  durationDays?: number;
  submittedAt?: Date;
  approvedAt?: Date;
  deniedAt?: Date;
  expiresAt?: Date;
  issues?: string[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PAClinicalCriteria = {
  id: string;
  priorAuthId: string;
  criteriaType: string;
  description: string;
  isMet: boolean;
  value?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PARequirementRule = {
  id: string;
  priorAuthId: string;
  ruleType: string;
  description: string;
  isRequired: boolean;
  isMet: boolean;
  value?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type Document = {
  id: string;
  organizationId: string;
  patientId?: string;
  priorAuthId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: string;
  description?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface PriorAuthSlice {
  // State
  priorAuths: PriorAuth[];
  selectedPriorAuth: PriorAuth | null;
  paClinicalCriteria: Record<string, PAClinicalCriteria[]>;
  paRequirementRules: Record<string, PARequirementRule[]>;
  paSupportingDocuments: Record<string, Document[]>;

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
    status?: PriorAuth["status"][];
    payerId?: string;
    patientId?: string;
    medication?: string;
    urgency?: "routine" | "urgent" | "stat";
    expiringWithin?: number; // days
    assignedTo?: string;
  };

  // Actions
  setPriorAuths: (priorAuths: PriorAuth[]) => void;
  setSelectedPriorAuth: (priorAuth: PriorAuth | null) => void;
  addPriorAuth: (priorAuth: PriorAuth) => void;
  updatePriorAuth: (id: string, updates: Partial<PriorAuth>) => void;
  removePriorAuth: (id: string) => void;

  // PA clinical criteria actions
  setPAClinicalCriteria: (
    paId: string,
    criteria: PAClinicalCriteria[]
  ) => void;
  addPAClinicalCriteria: (criteria: PAClinicalCriteria) => void;
  updatePAClinicalCriteria: (
    id: string,
    updates: Partial<PAClinicalCriteria>
  ) => void;
  removePAClinicalCriteria: (id: string) => void;

  // PA requirement rules actions
  setPARequirementRules: (
    paId: string,
    rules: PARequirementRule[]
  ) => void;
  addPARequirementRule: (rule: PARequirementRule) => void;
  updatePARequirementRule: (
    id: string,
    updates: Partial<PARequirementRule>
  ) => void;
  removePARequirementRule: (id: string) => void;

  // PA supporting documents actions
  setPASupportingDocuments: (
    paId: string,
    documents: Document[]
  ) => void;
  addPASupportingDocument: (document: Document) => void;
  updatePASupportingDocument: (
    id: string,
    updates: Partial<Document>
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
    status: ["pending"],
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
      const paId = criteria.priorAuthId;
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
      const paId = rule.priorAuthId;
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
      const paId = document.priorAuthId ?? "";
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
      for (const paId of Object.keys(newDocuments)) {
        newDocuments[paId] = newDocuments[paId].map((d) =>
          d.id === id ? { ...d, ...updates } : d
        );
      }
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
        status: ["pending"],
        urgency: "routine",
      },
    }),

  // Async actions
  fetchPriorAuths: async () => {
    set({ priorAuthsLoading: true, priorAuthsError: null });
    try {
      const response = await fetch('/api/prior-auths');
      if (!response.ok) throw new Error('Failed to fetch prior auths');
      
      const data = await response.json();
      set({ priorAuths: data.priorAuths || [], priorAuthsLoading: false });
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
      const response = await fetch(`/api/prior-auths/${id}`);
      if (!response.ok) throw new Error('Failed to fetch prior auth');
      
      const data = await response.json();
      if (data.priorAuth) {
        get().setSelectedPriorAuth(data.priorAuth);
        // Also update in priorAuths array if it exists
        const priorAuths = get().priorAuths;
        const existingIndex = priorAuths.findIndex((pa) => pa.id === id);
        if (existingIndex >= 0) {
          get().updatePriorAuth(id, data.priorAuth);
        } else {
          get().addPriorAuth(data.priorAuth);
        }
      }
    } catch (error) {
      console.error("Failed to fetch prior auth:", error);
    }
  },

  fetchPAClinicalCriteria: async (paId) => {
    set({ paClinicalCriteriaLoading: true, paClinicalCriteriaError: null });
    try {
      const response = await fetch(`/api/prior-auths/${paId}/clinical-criteria`);
      if (!response.ok) throw new Error('Failed to fetch PA clinical criteria');
      
      const data = await response.json();
      get().setPAClinicalCriteria(paId, data.clinicalCriteria || []);
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
      const response = await fetch(`/api/prior-auths/${paId}/requirement-rules`);
      if (!response.ok) throw new Error('Failed to fetch PA requirement rules');
      
      const data = await response.json();
      get().setPARequirementRules(paId, data.requirementRules || []);
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
      const response = await fetch(`/api/prior-auths/${paId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch PA supporting documents');
      
      const data = await response.json();
      get().setPASupportingDocuments(paId, data.documents || []);
      set({ paSupportingDocumentsLoading: false });
    } catch (error) {
      set({ paSupportingDocumentsLoading: false });
      console.error("Failed to fetch PA supporting documents:", error);
    }
  },

  submitPriorAuth: async (paId) => {
    try {
      const response = await fetch(`/api/prior-auths/${paId}/submit`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to submit prior auth');

      // Update local state
      get().updatePriorAuth(paId, {
        status: "pending",
        submittedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to submit prior auth:", error);
      throw error;
    }
  },

  approvePriorAuth: async (paId, approvalData) => {
    try {
      const response = await fetch(`/api/prior-auths/${paId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      if (!response.ok) throw new Error('Failed to approve prior auth');

      // Update local state
      get().updatePriorAuth(paId, {
        status: "approved",
        approvedAt: new Date(),
        authNumber: approvalData.approvalNumber,
        durationDays: approvalData.durationDays,
      });
    } catch (error) {
      console.error("Failed to approve prior auth:", error);
      throw error;
    }
  },

  denyPriorAuth: async (paId, denialReason) => {
    try {
      const response = await fetch(`/api/prior-auths/${paId}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ denialReason }),
      });

      if (!response.ok) throw new Error('Failed to deny prior auth');

      // Update local state
      get().updatePriorAuth(paId, {
        status: "denied",
        deniedAt: new Date(),
        issues: [denialReason],
      });
    } catch (error) {
      console.error("Failed to deny prior auth:", error);
      throw error;
    }
  },
});