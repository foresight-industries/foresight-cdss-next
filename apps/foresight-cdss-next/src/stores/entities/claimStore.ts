import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface ClaimSlice {
  // State
  claims: Tables<"claim">[];
  selectedClaim: Tables<"claim"> | null;
  claimLines: Record<string, Tables<"claim_line">[]>;
  claimAttachments: Record<string, Tables<"claim_attachment">[]>;
  claimValidations: Record<string, Tables<"claim_validation">[]>;
  claimStateHistory: Record<string, Tables<"claim_state_history">[]>;
  scrubberResults: Record<string, Tables<"scrubbing_result">[]>;
  denialTracking: Record<string, Tables<"denial_tracking">[]>;

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
    status?: Tables<"claim">["status"][];
    payerId?: number;
    patientId?: number;
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
  setClaims: (claims: Tables<"claim">[]) => void;
  setSelectedClaim: (claim: Tables<"claim"> | null) => void;
  addClaim: (claim: Tables<"claim">) => void;
  updateClaim: (id: string, updates: Partial<Tables<"claim">>) => void;
  removeClaim: (id: string) => void;

  // Claim lines actions
  setClaimLines: (claimId: string, lines: Tables<"claim_line">[]) => void;
  addClaimLine: (line: Tables<"claim_line">) => void;
  updateClaimLine: (id: string, updates: Partial<Tables<"claim_line">>) => void;
  removeClaimLine: (id: string) => void;

  // Claim attachments actions
  setClaimAttachments: (
    claimId: string,
    attachments: Tables<"claim_attachment">[]
  ) => void;
  addClaimAttachment: (attachment: Tables<"claim_attachment">) => void;
  updateClaimAttachment: (
    id: string,
    updates: Partial<Tables<"claim_attachment">>
  ) => void;
  removeClaimAttachment: (id: string) => void;

  // Claim validations actions
  setClaimValidations: (
    claimId: string,
    validations: Tables<"claim_validation">[]
  ) => void;
  addClaimValidation: (validation: Tables<"claim_validation">) => void;
  updateClaimValidation: (
    id: string,
    updates: Partial<Tables<"claim_validation">>
  ) => void;

  // State history actions
  setClaimStateHistory: (
    claimId: string,
    history: Tables<"claim_state_history">[]
  ) => void;
  addClaimStateHistory: (history: Tables<"claim_state_history">) => void;

  // Scrubber results actions
  setScrubberResults: (
    claimId: string,
    results: Tables<"scrubbing_result">[]
  ) => void;
  addScrubberResult: (result: Tables<"scrubbing_result">) => void;

  // Denial tracking actions
  setDenialTracking: (
    claimId: string,
    denials: Tables<"denial_tracking">[]
  ) => void;
  addDenialTracking: (denial: Tables<"denial_tracking">) => void;
  updateDenialTracking: (
    id: string,
    updates: Partial<Tables<"denial_tracking">>
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
    status: ["submitted", "in_review"],
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
      const claimId = line.claim_id;
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
      Object.keys(newLines).forEach((claimId) => {
        newLines[claimId] = newLines[claimId].map((l) =>
          l.id === id ? { ...l, ...updates } : l
        );
      });
      return { claimLines: newLines };
    }),

  removeClaimLine: (id) =>
    set((state) => {
      const newLines = { ...state.claimLines };
      Object.keys(newLines).forEach((claimId) => {
        newLines[claimId] = newLines[claimId].filter((l) => l.id !== id);
      });
      return { claimLines: newLines };
    }),

  // Claim attachments actions
  setClaimAttachments: (claimId, attachments) =>
    set((state) => ({
      claimAttachments: { ...state.claimAttachments, [claimId]: attachments },
    })),

  addClaimAttachment: (attachment) =>
    set((state) => {
      const claimId = attachment.claim_id ?? "";
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
      Object.keys(newAttachments).forEach((claimId) => {
        newAttachments[claimId] = newAttachments[claimId].map((a) =>
          a.id === id ? { ...a, ...updates } : a
        );
      });
      return { claimAttachments: newAttachments };
    }),

  removeClaimAttachment: (id) =>
    set((state) => {
      const newAttachments = { ...state.claimAttachments };
      Object.keys(newAttachments).forEach((claimId) => {
        newAttachments[claimId] = newAttachments[claimId].filter(
          (a) => a.id !== id
        );
      });
      return { claimAttachments: newAttachments };
    }),

  // Claim validations actions
  setClaimValidations: (claimId, validations) =>
    set((state) => ({
      claimValidations: { ...state.claimValidations, [claimId]: validations },
    })),

  addClaimValidation: (validation) =>
    set((state) => {
      const claimId = validation.claim_id;
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
      Object.keys(newValidations).forEach((claimId) => {
        newValidations[claimId] = newValidations[claimId].map((v) =>
          v.id === id ? { ...v, ...updates } : v
        );
      });
      return { claimValidations: newValidations };
    }),

  // State history actions
  setClaimStateHistory: (claimId, history) =>
    set((state) => ({
      claimStateHistory: { ...state.claimStateHistory, [claimId]: history },
    })),

  addClaimStateHistory: (history) =>
    set((state) => {
      const claimId = history.claim_id;
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
      const claimId = result.id ?? "";
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
      const claimId = denial.claim_id ?? "";
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
      Object.keys(newDenials).forEach((claimId) => {
        newDenials[claimId] = newDenials[claimId].map((d) =>
          d.id === id ? { ...d, ...updates } : d
        );
      });
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
        status: ["submitted", "in_review"],
        dateRange: "last_30_days",
      },
    }),

  // Async actions
  fetchClaims: async () => {
    set({ claimsLoading: true, claimsError: null });
    try {
      const { data, error } = await supabase
        .from("claim")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ claims: data || [], claimsLoading: false });
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
      const { data, error } = await supabase
        .from("claim")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        get().setSelectedClaim(data);
        // Also update in claims array if it exists
        const claims = get().claims;
        const existingIndex = claims.findIndex((c) => c.id === id);
        if (existingIndex >= 0) {
          get().updateClaim(id, data);
        } else {
          get().addClaim(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch claim:", error);
    }
  },

  fetchClaimLines: async (claimId) => {
    set({ claimLinesLoading: true, claimLinesError: null });
    try {
      const { data, error } = await supabase
        .from("claim_line")
        .select("*")
        .eq("claim_id", claimId);

      if (error) throw error;
      get().setClaimLines(claimId, data || []);
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
      const { data, error } = await supabase
        .from("claim_attachment")
        .select("*")
        .eq("claim_id", claimId);

      if (error) throw error;
      get().setClaimAttachments(claimId, data || []);
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
      const { data, error } = await supabase
        .from("claim_validation")
        .select("*")
        .eq("claim_id", claimId);

      if (error) throw error;
      get().setClaimValidations(claimId, data || []);
      set({ claimValidationsLoading: false });
    } catch (error) {
      set({ claimValidationsLoading: false });
    }
  },

  fetchClaimStateHistory: async (claimId) => {
    try {
      const { data, error } = await supabase
        .from("claim_state_history")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      get().setClaimStateHistory(claimId, data || []);
    } catch (error) {
      console.error("Failed to fetch claim state history:", error);
    }
  },

  fetchScrubberResults: async (claimId) => {
    set({ scrubberResultsLoading: true });
    try {
      const { data, error } = await supabase
        .from("scrubbing_result")
        .select("*")
        .eq("claim_id", claimId);

      if (error) throw error;
      get().setScrubberResults(claimId, data || []);
      set({ scrubberResultsLoading: false });
    } catch (error) {
      set({ scrubberResultsLoading: false });
    }
  },

  fetchDenialTracking: async (claimId) => {
    try {
      const { data, error } = await supabase
        .from("denial_tracking")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      get().setDenialTracking(claimId, data || []);
    } catch (error) {
      console.error("Failed to fetch denial tracking:", error);
    }
  },

  submitClaim: async (claimId, userId) => {
    try {
      const { error } = await supabase
        .from("claim")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", claimId);

      if (error) throw error;

      // Update local state
      get().updateClaim(claimId, {
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });

      // Add state history entry
      const historyEntry = {
        id: crypto.randomUUID(),
        claim_id: claimId,
        actor: userId || "system",
        at: new Date().toISOString(),
        state: "submitted",
        details: { previous_status: "draft", action: "submit" },
        created_at: new Date().toISOString(),
      };
      get().addClaimStateHistory(historyEntry);
    } catch (error) {
      console.error("Failed to submit claim:", error);
      throw error;
    }
  },

  resubmitClaim: async (claimId, userId) => {
    try {
      const { error } = await supabase
        .from("claim")
        .update({
          status: "resubmitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", claimId);

      if (error) throw error;

      // Update local state
      get().updateClaim(claimId, {
        status: "resubmitted",
        submitted_at: new Date().toISOString(),
      });

      // Add state history entry
      const historyEntry = {
        id: crypto.randomUUID(),
        claim_id: claimId,
        actor: userId || "system",
        at: new Date().toISOString(),
        state: "resubmitted",
        details: { previous_status: "denied", action: "resubmit" },
        created_at: new Date().toISOString(),
      };
      get().addClaimStateHistory(historyEntry);
    } catch (error) {
      console.error("Failed to resubmit claim:", error);
      throw error;
    }
  },
});
