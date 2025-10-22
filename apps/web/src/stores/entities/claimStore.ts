import { StateCreator } from "zustand";

// AWS-compatible types
type Claim = {
  id: string;
  organizationId: string;
  patientId: string;
  payerId: string;
  status: 'draft' | 'ready_for_submission' | 'submitted' | 'accepted' | 'rejected' | 'paid' | 'denied' | 'pending' | 'needs_review' | 'appeal_required';
  claimNumber?: string;
  serviceDate: Date;
  diagnosisCode: string;
  diagnosisDescription: string;
  totalAmount: number;
  paidAmount?: number;
  adjustedAmount?: number;
  billingProviderId: string;
  submittedAt?: Date;
  processedAt?: Date;
  paidAt?: Date;
  dueDate?: Date;
  notes?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ClaimLine = {
  id: string;
  claimId: string;
  lineNumber: number;
  procedureCode: string;
  procedureDescription: string;
  units: number;
  unitPrice: number;
  totalAmount: number;
  diagnosisPointer?: string;
  modifiers?: string[];
  placeOfService?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ClaimAttachment = {
  id: string;
  claimId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  attachmentType: string;
  description?: string;
  createdAt: Date;
};

type ClaimValidation = {
  id: string;
  claimId: string;
  validationType: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  createdAt: Date;
};

type ClaimStateHistory = {
  id: string;
  claimId: string;
  actor: string;
  at: Date;
  state: string;
  details?: any;
  createdAt: Date;
};

type ScrubberResult = {
  id: string;
  claimId: string;
  ruleId: string;
  ruleName: string;
  ruleType: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  suggestions?: string[];
  details?: any;
  createdAt: Date;
};

type DenialTracking = {
  id: string;
  claimId: string;
  denialCode: string;
  denialReason: string;
  denialDate: Date;
  appealDeadline?: Date;
  appealStatus?: 'pending' | 'submitted' | 'approved' | 'denied';
  appealSubmittedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ClaimSlice {
  // State
  claims: Claim[];
  selectedClaim: Claim | null;
  claimLines: Record<string, ClaimLine[]>;
  claimAttachments: Record<string, ClaimAttachment[]>;
  claimValidations: Record<string, ClaimValidation[]>;
  claimStateHistory: Record<string, ClaimStateHistory[]>;
  scrubberResults: Record<string, ScrubberResult[]>;
  denialTracking: Record<string, DenialTracking[]>;

  // Loading states
  claimsLoading: boolean;
  claimLinesLoading: boolean;
  claimAttachmentsLoading: boolean;
  claimValidationsLoading: boolean;
  scrubberResultsLoading: boolean;

  // Error states
  claimsError: string | null;
  claimLinesError: string | null;
  claimAttachmentsError: string | null;

  // Filter state
  claimFilters: {
    status?: Claim["status"][];
    payerId?: string;
    patientId?: string;
    dateRange?:
      | "today"
      | "last_7_days"
      | "last_30_days"
      | "last_90_days"
      | "custom";
    customDateRange?: { from: Date; to: Date };
    minAmount?: number;
    maxAmount?: number;
    hasDenial?: boolean;
    assignedTo?: string;
  };

  // Actions
  setClaims: (claims: Claim[]) => void;
  setSelectedClaim: (claim: Claim | null) => void;
  addClaim: (claim: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  removeClaim: (id: string) => void;

  // Claim lines actions
  setClaimLines: (claimId: string, lines: ClaimLine[]) => void;
  addClaimLine: (line: ClaimLine) => void;
  updateClaimLine: (id: string, updates: Partial<ClaimLine>) => void;
  removeClaimLine: (id: string) => void;

  // Claim attachments actions
  setClaimAttachments: (
    claimId: string,
    attachments: ClaimAttachment[]
  ) => void;
  addClaimAttachment: (attachment: ClaimAttachment) => void;
  updateClaimAttachment: (
    id: string,
    updates: Partial<ClaimAttachment>
  ) => void;
  removeClaimAttachment: (id: string) => void;

  // Claim validations actions
  setClaimValidations: (
    claimId: string,
    validations: ClaimValidation[]
  ) => void;
  addClaimValidation: (validation: ClaimValidation) => void;
  updateClaimValidation: (
    id: string,
    updates: Partial<ClaimValidation>
  ) => void;

  // State history actions
  setClaimStateHistory: (
    claimId: string,
    history: ClaimStateHistory[]
  ) => void;
  addClaimStateHistory: (history: ClaimStateHistory) => void;

  // Scrubber results actions
  setScrubberResults: (
    claimId: string,
    results: ScrubberResult[]
  ) => void;
  addScrubberResult: (result: ScrubberResult) => void;

  // Denial tracking actions
  setDenialTracking: (
    claimId: string,
    denials: DenialTracking[]
  ) => void;
  addDenialTracking: (denial: DenialTracking) => void;
  updateDenialTracking: (
    id: string,
    updates: Partial<DenialTracking>
  ) => void;

  // Filter actions
  setClaimFilters: (filters: ClaimSlice["claimFilters"]) => void;
  clearClaimFilters: () => void;

  // Async actions
  fetchClaims: () => Promise<void>;
  fetchClaimById: (id: string) => Promise<void>;
  fetchClaimLines: (claimId: string) => Promise<void>;
  fetchClaimAttachments: (claimId: string) => Promise<void>;
  fetchClaimValidations: (claimId: string) => Promise<void>;
  fetchClaimStateHistory: (claimId: string) => Promise<void>;
  fetchScrubberResults: (claimId: string) => Promise<void>;
  fetchDenialTracking: (claimId: string) => Promise<void>;
  submitClaim: (claimId: string, userId?: string) => Promise<void>;
  resubmitClaim: (claimId: string, userId?: string) => Promise<void>;
}

export const createClaimSlice: StateCreator<ClaimSlice, [], [], ClaimSlice> = (
  set,
  get
) => ({
  // Initial state
  claims: [],
  selectedClaim: null,
  claimLines: {},
  claimAttachments: {},
  claimValidations: {},
  claimStateHistory: {},
  scrubberResults: {},
  denialTracking: {},

  // Loading states
  claimsLoading: false,
  claimLinesLoading: false,
  claimAttachmentsLoading: false,
  claimValidationsLoading: false,
  scrubberResultsLoading: false,

  // Error states
  claimsError: null,
  claimLinesError: null,
  claimAttachmentsError: null,

  // Filter state
  claimFilters: {
    status: ["submitted", "pending"],
    dateRange: "last_30_days",
  },

  // Basic actions
  setClaims: (claims) => set({ claims }),
  setSelectedClaim: (claim) => set({ selectedClaim: claim }),

  addClaim: (claim) =>
    set((state) => ({
      claims: [...state.claims, claim],
    })),

  updateClaim: (id, updates) =>
    set((state) => ({
      claims: state.claims.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      selectedClaim:
        state.selectedClaim?.id === id
          ? { ...state.selectedClaim, ...updates }
          : state.selectedClaim,
    })),

  removeClaim: (id) =>
    set((state) => ({
      claims: state.claims.filter((c) => c.id !== id),
      selectedClaim:
        state.selectedClaim?.id === id ? null : state.selectedClaim,
    })),

  // Claim lines actions
  setClaimLines: (claimId, lines) =>
    set((state) => ({
      claimLines: { ...state.claimLines, [claimId]: lines },
    })),

  addClaimLine: (line) =>
    set((state) => {
      const claimId = line.claimId;
      const currentLines = state.claimLines[claimId] || [];
      return {
        claimLines: {
          ...state.claimLines,
          [claimId]: [...currentLines, line],
        },
      };
    }),

  updateClaimLine: (id, updates) =>
    set((state) => {
      const newLines = { ...state.claimLines };
      for (const claimId of Object.keys(newLines)) {
        newLines[claimId] = newLines[claimId].map((l) =>
          l.id === id ? { ...l, ...updates } : l
        );
      }
      return { claimLines: newLines };
    }),

  removeClaimLine: (id) =>
    set((state) => {
      const newLines = { ...state.claimLines };
      for (const claimId of Object.keys(newLines)) {
        newLines[claimId] = newLines[claimId].filter((l) => l.id !== id);
      }
      return { claimLines: newLines };
    }),

  // Claim attachments actions
  setClaimAttachments: (claimId, attachments) =>
    set((state) => ({
      claimAttachments: { ...state.claimAttachments, [claimId]: attachments },
    })),

  addClaimAttachment: (attachment) =>
    set((state) => {
      const claimId = attachment.claimId;
      const currentAttachments = state.claimAttachments[claimId] || [];
      return {
        claimAttachments: {
          ...state.claimAttachments,
          [claimId]: [...currentAttachments, attachment],
        },
      };
    }),

  updateClaimAttachment: (id, updates) =>
    set((state) => {
      const newAttachments = { ...state.claimAttachments };
      for (const claimId of Object.keys(newAttachments)) {
        newAttachments[claimId] = newAttachments[claimId].map((a) =>
          a.id === id ? { ...a, ...updates } : a
        );
      }
      return { claimAttachments: newAttachments };
    }),

  removeClaimAttachment: (id) =>
    set((state) => {
      const newAttachments = { ...state.claimAttachments };
      for (const claimId of Object.keys(newAttachments)) {
        newAttachments[claimId] = newAttachments[claimId].filter(
          (a) => a.id !== id
        );
      }
      return { claimAttachments: newAttachments };
    }),

  // Claim validations actions
  setClaimValidations: (claimId, validations) =>
    set((state) => ({
      claimValidations: { ...state.claimValidations, [claimId]: validations },
    })),

  addClaimValidation: (validation) =>
    set((state) => {
      const claimId = validation.claimId;
      const currentValidations = state.claimValidations[claimId] || [];
      return {
        claimValidations: {
          ...state.claimValidations,
          [claimId]: [...currentValidations, validation],
        },
      };
    }),

  updateClaimValidation: (id, updates) =>
    set((state) => {
      const newValidations = { ...state.claimValidations };
      for (const claimId of Object.keys(newValidations)) {
        newValidations[claimId] = newValidations[claimId].map((v) =>
          v.id === id ? { ...v, ...updates } : v
        );
      }
      return { claimValidations: newValidations };
    }),

  // State history actions
  setClaimStateHistory: (claimId, history) =>
    set((state) => ({
      claimStateHistory: { ...state.claimStateHistory, [claimId]: history },
    })),

  addClaimStateHistory: (history) =>
    set((state) => {
      const claimId = history.claimId;
      const currentHistory = state.claimStateHistory[claimId] || [];
      return {
        claimStateHistory: {
          ...state.claimStateHistory,
          [claimId]: [...currentHistory, history],
        },
      };
    }),

  // Scrubber results actions
  setScrubberResults: (claimId, results) =>
    set((state) => ({
      scrubberResults: { ...state.scrubberResults, [claimId]: results },
    })),

  addScrubberResult: (result) =>
    set((state) => {
      const claimId = result.claimId;
      const currentResults = state.scrubberResults[claimId] || [];
      return {
        scrubberResults: {
          ...state.scrubberResults,
          [claimId]: [...currentResults, result],
        },
      };
    }),

  // Denial tracking actions
  setDenialTracking: (claimId, denials) =>
    set((state) => ({
      denialTracking: { ...state.denialTracking, [claimId]: denials },
    })),

  addDenialTracking: (denial) =>
    set((state) => {
      const claimId = denial.claimId;
      const currentDenials = state.denialTracking[claimId] || [];
      return {
        denialTracking: {
          ...state.denialTracking,
          [claimId]: [...currentDenials, denial],
        },
      };
    }),

  updateDenialTracking: (id, updates) =>
    set((state) => {
      const newDenials = { ...state.denialTracking };
      for (const claimId of Object.keys(newDenials)) {
        newDenials[claimId] = newDenials[claimId].map((d) =>
          d.id === id ? { ...d, ...updates } : d
        );
      }
      return { denialTracking: newDenials };
    }),

  // Filter actions
  setClaimFilters: (filters) =>
    set((state) => ({
      claimFilters: { ...state.claimFilters, ...filters },
    })),

  clearClaimFilters: () =>
    set({
      claimFilters: {
        status: ["submitted", "pending"],
        dateRange: "last_30_days",
      },
    }),

  // Async actions
  fetchClaims: async () => {
    set({ claimsLoading: true, claimsError: null });
    try {
      const response = await fetch('/api/claims');
      if (!response.ok) throw new Error('Failed to fetch claims');
      
      const data = await response.json();
      set({ claims: data.claims || [], claimsLoading: false });
    } catch (error) {
      set({
        claimsError:
          error instanceof Error ? error.message : "Failed to fetch claims",
        claimsLoading: false,
      });
    }
  },

  fetchClaimById: async (id) => {
    try {
      const response = await fetch(`/api/claims/${id}`);
      if (!response.ok) throw new Error('Failed to fetch claim');
      
      const data = await response.json();
      if (data.claim) {
        get().setSelectedClaim(data.claim);
        // Also update in claims array if it exists
        const claims = get().claims;
        const existingIndex = claims.findIndex((c) => c.id === id);
        if (existingIndex >= 0) {
          get().updateClaim(id, data.claim);
        } else {
          get().addClaim(data.claim);
        }
      }
    } catch (error) {
      console.error("Failed to fetch claim:", error);
    }
  },

  fetchClaimLines: async (claimId) => {
    set({ claimLinesLoading: true, claimLinesError: null });
    try {
      const response = await fetch(`/api/claims/${claimId}/lines`);
      if (!response.ok) throw new Error('Failed to fetch claim lines');
      
      const data = await response.json();
      get().setClaimLines(claimId, data.claimLines || []);
      set({ claimLinesLoading: false });
    } catch (error) {
      set({
        claimLinesError:
          error instanceof Error
            ? error.message
            : "Failed to fetch claim lines",
        claimLinesLoading: false,
      });
    }
  },

  fetchClaimAttachments: async (claimId) => {
    set({ claimAttachmentsLoading: true, claimAttachmentsError: null });
    try {
      const response = await fetch(`/api/claims/${claimId}/attachments`);
      if (!response.ok) throw new Error('Failed to fetch claim attachments');
      
      const data = await response.json();
      get().setClaimAttachments(claimId, data.attachments || []);
      set({ claimAttachmentsLoading: false });
    } catch (error) {
      set({
        claimAttachmentsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch claim attachments",
        claimAttachmentsLoading: false,
      });
    }
  },

  fetchClaimValidations: async (claimId) => {
    set({ claimValidationsLoading: true });
    try {
      const response = await fetch(`/api/claims/${claimId}/validations`);
      if (!response.ok) throw new Error('Failed to fetch claim validations');
      
      const data = await response.json();
      get().setClaimValidations(claimId, data.validations || []);
      set({ claimValidationsLoading: false });
    } catch (error) {
      set({ claimValidationsLoading: false });
      console.error("Failed to fetch claim validations:", error);
    }
  },

  fetchClaimStateHistory: async (claimId) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/history`);
      if (!response.ok) throw new Error('Failed to fetch claim state history');
      
      const data = await response.json();
      get().setClaimStateHistory(claimId, data.history || []);
    } catch (error) {
      console.error("Failed to fetch claim state history:", error);
    }
  },

  fetchScrubberResults: async (claimId) => {
    set({ scrubberResultsLoading: true });
    try {
      const response = await fetch(`/api/claims/${claimId}/scrubber-results`);
      if (!response.ok) throw new Error('Failed to fetch scrubber results');
      
      const data = await response.json();
      get().setScrubberResults(claimId, data.results || []);
      set({ scrubberResultsLoading: false });
    } catch (error) {
      set({ scrubberResultsLoading: false });
      console.error("Failed to fetch scrubber results:", error);
    }
  },

  fetchDenialTracking: async (claimId) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/denials`);
      if (!response.ok) throw new Error('Failed to fetch denial tracking');
      
      const data = await response.json();
      get().setDenialTracking(claimId, data.denials || []);
    } catch (error) {
      console.error("Failed to fetch denial tracking:", error);
    }
  },

  submitClaim: async (claimId, userId) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to submit claim');

      // Update local state
      get().updateClaim(claimId, {
        status: "submitted",
        submittedAt: new Date(),
      });

      // Add state history entry
      const historyEntry: ClaimStateHistory = {
        id: crypto.randomUUID(),
        claimId: claimId,
        actor: userId || "system",
        at: new Date(),
        state: "submitted",
        details: { previous_status: "draft", action: "submit" },
        createdAt: new Date(),
      };
      get().addClaimStateHistory(historyEntry);
    } catch (error) {
      console.error("Failed to submit claim:", error);
      throw error;
    }
  },

  resubmitClaim: async (claimId, userId) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to resubmit claim');

      // Update local state
      get().updateClaim(claimId, {
        status: "submitted",
        submittedAt: new Date(),
      });

      // Add state history entry
      const historyEntry: ClaimStateHistory = {
        id: crypto.randomUUID(),
        claimId: claimId,
        actor: userId || "system",
        at: new Date(),
        state: "resubmitted",
        details: { previous_status: "denied", action: "resubmit" },
        createdAt: new Date(),
      };
      get().addClaimStateHistory(historyEntry);
    } catch (error) {
      console.error("Failed to resubmit claim:", error);
      throw error;
    }
  },
});